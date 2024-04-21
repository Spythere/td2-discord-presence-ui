export type ActivityType = 'none' | 'driver' | 'dispatcher'
export type PresenceMode = ActivityType | 'disconnected' | 'connected' | 'error'

export interface PlayerActivity {
  driver: Driver | null
  dispatcher: Dispatcher[]
}

export enum DispatcherStatus {
  FREE = -3,
  INVALID = -2,
  UNKNOWN = -1,
  NO_LIMIT = 0,
  AFK = 1,
  ENDING = 2,
  NO_SPACE = 3,
  UNAVAILABLE = 4,
  NOT_LOGGED_IN = 5
}

export interface Driver {
  id: string
  trainNo: number
  mass: number
  speed: number
  length: number
  distance: number
  stockString: string
  driverName: string
  driverId: number
  driverIsSupporter: boolean
  driverLevel: number
  currentStationHash: string
  currentStationName: string
  signal: string
  connectedTrack: string
  online: number
  lastSeen: number
  region: string
  isTimeout: boolean
  timetable: Timetable
}

export interface Timetable {
  SKR: boolean
  TWR: boolean
  category: string
  stopList: StopList[]
  route: string
  timetableId: number
  sceneries: string[]
}

export interface StopList {
  stopName: string
  stopNameRAW: string
  stopType: string
  stopDistance: number
  pointId: string
  comments: string | null
  mainStop: boolean
  arrivalLine: string | null
  arrivalTimestamp: number
  arrivalRealTimestamp: number
  arrivalDelay: number
  departureLine: string | null
  departureTimestamp: number
  departureRealTimestamp: number
  departureDelay: number
  beginsHere: boolean
  terminatesHere: boolean
  confirmed: number
  stopped: number
  stopTime: number | null
}

export interface Dispatcher {
  id: number
  currentDuration: number
  dispatcherId: number
  dispatcherName: string
  isOnline: boolean
  lastOnlineTimestamp: number
  region: string
  stationHash: string
  stationName: string
  timestampFrom: number
  timestampTo: number | null
  dispatcherLevel: number
  dispatcherIsSupporter: boolean
  createdAt: string
  updatedAt: string
  dispatcherStatus: DispatcherStatus | number
  dispatcherRate: number
  statusHistory: string[]
  hidden: boolean
}
