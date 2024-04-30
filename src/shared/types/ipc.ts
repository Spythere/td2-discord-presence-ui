import { ActivityType } from './common'

export interface PresenceModeDataIPC {
  connected: boolean
  discordUsername: string | null
  activityType: ActivityType
  error: unknown | null
  activityUser: string | null
}
