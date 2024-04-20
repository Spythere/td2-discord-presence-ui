import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PresenceManager } from './presenceManager'

const presenceManager = new PresenceManager()
let mainWindow: BrowserWindow

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
  electronApp.setAppUserModelId('com.electron')

  // const icon = nativeImage.createFromPath()
  // const tray = new Tray(icon)

  // const contextMenu = Menu.buildFromTemplate([
  //   { label: 'Item1', type: 'radio' },
  //   { label: 'Item2', type: 'radio' },
  //   { label: 'Item3', type: 'radio', checked: true },
  //   { label: 'Item4', type: 'radio' }
  // ])

  // tray.setToolTip('This is my application.')
  // tray.setContextMenu(contextMenu)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC
  ipcMain.on('runPresence', async (_event, args) => {
    const data = args[0]

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
      }
    } catch (error) {
      mainWindow.webContents.send('presenceMode', ['error', null])
      console.error('Presence: error occured!', error)
    }
  })

  ipcMain.on('resetPresence', () => {
    if (!presenceManager.client.user) return

    try {
      console.log('Presence: resetting...')
      presenceManager.client.clearActivity()
      mainWindow.webContents.send('presenceMode', ['connected', null])
    } catch (error) {
      mainWindow.webContents.send('presenceMode', ['error', null])
      console.log('Presence: error occured when resetting activity status', error)
    }
  })

  ipcMain.on('exit', () => {
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
