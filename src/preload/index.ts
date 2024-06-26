import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('context', {
      exitApp: () => ipcRenderer.send('exitApp')
    })

    contextBridge.exposeInMainWorld('presence', {
      startPresence: (playerName: string) => ipcRenderer.send('startPresence', [playerName]),
      resetPresence: () => ipcRenderer.send('resetPresence')
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
