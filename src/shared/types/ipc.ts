import { ActivityType } from './common'

export interface PresenceModeDataIPC {
  connected: boolean
  discordUsername?: string
  error?: unknown
  activityType?: ActivityType
  activityUser?: string
}
