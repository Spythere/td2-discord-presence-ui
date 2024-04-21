import { ElectronAPI } from '@electron-toolkit/preload'
import { PlayerActivity } from '@shared/types/common'

declare global {
  interface Window {
    electron: ElectronAPI
    presence: {
      runPresence: (playerActivity: PlayerActivity) => void
      resetPresence: () => void
    }
    context: {
      exitApp: () => void
    }
  }
}
