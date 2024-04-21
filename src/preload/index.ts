import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PlayerActivity } from '@shared/types/common'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('context', {
      exitApp: () => ipcRenderer.send('exitApp')
    })

    contextBridge.exposeInMainWorld('presence', {
      runPresence: (playerActivity: PlayerActivity) =>
        ipcRenderer.send('runPresence', [playerActivity]),

      resetPresence: () => ipcRenderer.send('resetPresence')
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
