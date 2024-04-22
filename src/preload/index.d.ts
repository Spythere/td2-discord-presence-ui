import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    presence: {
      startPresence: (playerName: string) => void
      resetPresence: () => void
    }
    context: {
      exitApp: () => void
    }
  }
}
