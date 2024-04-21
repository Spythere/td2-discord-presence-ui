import { app, shell, BrowserWindow, ipcMain, Event, dialog } from 'electron'
import { join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { PresenceManager } from './presenceManager'
import icon from '../../resources/icon.png?asset'
import { Menu, Tray } from 'electron/main'
import settings from 'electron-settings'
import { PlayerActivity } from '../shared/types/common'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

const presenceManager = new PresenceManager()
let mainWindow: BrowserWindow

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    icon,
    show: false,
    title: 'TD2 Discord Presence',
    center: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('minimize', function (event: Event) {
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // autoUpdater.checkForUpdatesAndNotify()
  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'TD2 Discord Presence', type: 'normal', click: () => mainWindow.show() },
    { label: 'Wyjdź z Presence', type: 'normal', click: () => app.quit() }
  ])

  tray.on('click', () => mainWindow.show())

  tray.setToolTip('TD2 Discord Presence')
  tray.setContextMenu(contextMenu)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC
  ipcMain.on('runPresence', async (_event, args) => {
    const data = args[0] as PlayerActivity

    if (!(await settings.get('reminder.set'))) {
      dialog.showMessageBox({
        message:
          'Upewnij się, że twoje ustawienia statusów aktywności Discorda (Ustawienia -> Prywatność aktywności) oraz osobiste ustawienia prywatności serwera, na którym chcesz pokazać aktywność są włączone! W innym wypadku aktywność nie będzie pokazana dla innych osób (nawet jeśli u ciebie jest ona wyświetlana)!',
        title: 'Przypomnienie o ustawieniach prywatności!',
        icon
      })

      await settings.set('reminder', { set: true })
    }

    console.log('Presence: runPresence')

    try {
      if (!presenceManager.client.user) {
        console.log('Presence: connecting...')
        await presenceManager.client.login({ clientId: '1080201895139885066' })

        mainWindow.webContents.send('presenceMode', ['connected', null])

        console.log('Presence: connected successfully')
      }

      if (data) {
        const activityMode = await presenceManager.setPlayerActivity(data)
        mainWindow.webContents.send('presenceMode', activityMode)
      } else {
        await presenceManager.resetActivity()
        mainWindow.webContents.send('presenceMode', ['connected', null])
      }
    } catch (error) {
      mainWindow.webContents.send('presenceMode', ['error', null, error])
      console.error('Presence: error occured!', error)
    }
  })

  ipcMain.on('resetPresence', () => {
    if (!presenceManager.client.user) return

    presenceManager
      .resetActivity()
      .then(() => {
        mainWindow.webContents.send('presenceMode', ['connected', null])
      })
      .catch((error) => mainWindow.webContents.send('presenceMode', ['error', null, error]))
  })

  ipcMain.on('exitApp', () => {
    app.quit()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/* Auto Updater events */
autoUpdater.on('checking-for-update', () => {
  mainWindow.webContents.send('updateStatus', ['Checking...'])
})

autoUpdater.on('update-available', (info) => {
  console.log('Nowa wersja :D', info.version)

  mainWindow.webContents.send('updateStatus', ['New version'])
})

autoUpdater.on('update-not-available', (info) => {
  console.log('Brak nowej wersji :|', info.version)

  mainWindow.webContents.send('updateStatus', ['Not available'])
})
