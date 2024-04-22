import { app, shell, BrowserWindow, ipcMain, Event, dialog } from 'electron'
import { join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { Menu, Tray } from 'electron/main'
import settings from 'electron-settings'
import { PresenceManager } from './presenceManager'
import { fetchPresenceData } from './http'
import { PresenceModeDataIPC } from '../shared/types/ipc'

let mainWindow: BrowserWindow
let interval: undefined | NodeJS.Timeout = undefined

function ipcCallbackToRenderer(mainWindow: BrowserWindow, data: PresenceModeDataIPC) {
  mainWindow.webContents.send('presenceMode', [
    {
      ...data,
      discordUsername: PresenceManager.client.user?.username ?? '---'
    } as PresenceModeDataIPC
  ])
}

async function initPresence() {
  console.log('presence: init')

  if (!(await settings.get('reminder2.set'))) {
    dialog.showMessageBox({
      message:
        'Upewnij się, że twoje ustawienia statusów aktywności Discorda (Ustawienia -> Prywatność aktywności) oraz osobiste ustawienia prywatności serwera, na którym chcesz pokazać aktywność są włączone! W innym wypadku aktywność nie będzie pokazana dla innych osób (nawet jeśli u ciebie jest ona wyświetlana)!',
      title: 'Przypomnienie o ustawieniach prywatności!',
      icon
    })

    await settings.set('reminder2', { set: true })
  }

  await PresenceManager.connectToDiscord()
}

async function startPresence(currentPlayerName: string) {
  console.log('presence: start')

  updatePresence(currentPlayerName)

  if (interval != null) clearInterval(interval)
  interval = setInterval(() => updatePresence(currentPlayerName), 5000)
}

async function stopPresence() {
  console.log('presence: stop')
  clearInterval(interval)

  if (!PresenceManager.client) return

  if (!PresenceManager.client.user) {
    ipcCallbackToRenderer(mainWindow, { connected: false, error: 'No discord connection' })
    return
  }

  try {
    PresenceManager.resetActivity()
    ipcCallbackToRenderer(mainWindow, { connected: true })
  } catch (error) {
    ipcCallbackToRenderer(mainWindow, { connected: false, error: error })
  }
}

async function updatePresence(currentPlayerName: string) {
  console.log('presence: update ' + currentPlayerName)

  try {
    ipcCallbackToRenderer(mainWindow, { connected: true, activityType: 'searching' })
    const data = (await fetchPresenceData(currentPlayerName)).data

    const activityMode = await PresenceManager.setPlayerActivity(data)

    ipcCallbackToRenderer(mainWindow, {
      connected: true,
      activityType: activityMode[0],
      activityUser: activityMode[1] ?? undefined
    })
  } catch (error) {
    ipcCallbackToRenderer(mainWindow, { connected: false, error: error })
    console.error('Presence: error occured!', error)
  }
}

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

  /* Single instance lock */
  const isSingleInstance = app.requestSingleInstanceLock()
  if (!isSingleInstance) app.quit()

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  /* Auto Updater events */
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updateStatus', ['New version'])

    dialog.showMessageBox({
      message: `Nowa wersja aplikacji dostępna (v${info.version})! Aktualizacja zostanie zainstalowana automatycznie po wyjściu z aplikacji!`,
      title: 'Nowa wersja TD2 Discord Presence',
      icon
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('minimize', function (event: Event) {
    event.preventDefault()
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
  autoUpdater.checkForUpdatesAndNotify()

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

  /* IPC listeners */
  ipcMain.on('startPresence', async (_event, args) => {
    try {
      if (!PresenceManager.client.user) {
        await initPresence()
      }

      const currentPlayerName = args[0]
      startPresence(currentPlayerName)
    } catch (error) {
      ipcCallbackToRenderer(mainWindow, { connected: false, error: error })
      console.log(error)
    }
  })

  ipcMain.on('resetPresence', () => {
    stopPresence()
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
