import { Client } from 'discord-rpc'
import { ActivityType, DispatcherStatus, PlayerActivity } from '@shared/types/common'

function getDispatcherStatusText(status: DispatcherStatus | number) {
  switch (status) {
    case DispatcherStatus.AFK:
      return 'ZARAZ WRACAM'
    case DispatcherStatus.ENDING:
      return 'KOŃCZY'
    case DispatcherStatus.INVALID:
      return 'ZŁY HASH'
    case DispatcherStatus.NOT_LOGGED_IN:
      return 'NIEZALOGOWANY'
    case DispatcherStatus.UNAVAILABLE:
      return 'NIEDOSTĘPNY'
    case DispatcherStatus.NO_LIMIT:
      return 'BEZ LIMITU'
    case DispatcherStatus.NO_SPACE:
      return 'BRAK MIEJSCA'
    case DispatcherStatus.UNKNOWN:
      return 'NIEZNANY STATUS'
    default:
      return `DOSTĘPNY DO ${new Date(status).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
  }
}

export abstract class PresenceManager {
  public static client = new Client({ transport: 'ipc' })
  private static currentDispatcherIndex = 0
  private static lastPlayerName = ''
  private static startDate = new Date()
  private static currentDriverMode = 'relation' as 'relation' | 'driver'

  static resetState() {
    this.currentDispatcherIndex = 0
    this.startDate = new Date()
    this.currentDriverMode = 'relation'
  }

  static async connectToDiscord() {
    if (this.client.user) return

    this.client = new Client({ transport: 'ipc' })
    await this.client.login({ clientId: '1080201895139885066' })
  }

  static async resetActivity() {
    await this.client.clearActivity()
    this.resetState()
    this.lastPlayerName = ''
  }

  static async setPlayerActivity(activityData: PlayerActivity): Promise<[ActivityType, string]> {
    if (!this.client || !this.client.user) throw 'Discord disconnected'

    const { driver, dispatcher } = activityData

    if (driver != null) {
      if (this.lastPlayerName != driver.driverName) {
        this.resetState()
      }

      const { timetable } = driver
      let driverPosition = `- ${driver.speed} km/h`

      if (driver.connectedTrack) driverPosition += ` | szlak: ${driver.connectedTrack}`
      else if (driver.signal) driverPosition += ` | semafor: ${driver.signal}`

      const stationName = driver.currentStationName.includes('.sc')
        ? `${driver.currentStationName.replace('.sc', '').split(' ').slice(0, -1).join(' ')} - offline`
        : driver.currentStationName

      const details =
        this.currentDriverMode == 'relation'
          ? timetable
            ? `${timetable.category} ${driver.trainNo} ${timetable.route.replace('|', ' > ')}`
            : `${driver.trainNo} - brak rozkładu jazdy`
          : `${driver.driverName} | prowadzi: ${driver.stockString.split(';')[0]}`

      const startTimestamp = timetable
        ? new Date(timetable.stopList[0].departureRealTimestamp)
        : this.startDate

      await this.client.setActivity({
        details,
        state: `${stationName} ${driverPosition}`,
        largeImageKey: 'td2',
        largeImageText: 'Train Driver 2',
        smallImageKey: 'driver',
        smallImageText: 'Tryb maszynisty',
        startTimestamp,
        buttons: [
          {
            label: timetable ? 'Szczegółowy rozkład jazdy' : 'Informacje o maszyniście',
            url: encodeURI(
              `https://stacjownik-td2.web.app/trains?trainId=${driver.driverName}${driver.trainNo}`
            )
          }
        ]
      })

      this.currentDriverMode = this.currentDriverMode == 'driver' ? 'relation' : 'driver'
      this.lastPlayerName = driver.driverName
      return ['driver', driver.driverName]
    } else if (dispatcher != null && dispatcher.length > 0) {
      if (this.lastPlayerName != dispatcher[0].dispatcherName) {
        this.resetState()
      }

      // in case of a dispatcher count changed since the last update
      this.currentDispatcherIndex = this.currentDispatcherIndex % dispatcher.length

      await this.client.setActivity({
        details: `Dyżurny ${dispatcher[this.currentDispatcherIndex].dispatcherName} | ${dispatcher[this.currentDispatcherIndex].stationName}`,
        state: getDispatcherStatusText(dispatcher[this.currentDispatcherIndex].dispatcherStatus),
        largeImageKey: 'td2',
        largeImageText: 'Train Driver 2',
        smallImageKey: 'dispatcher',
        smallImageText: 'Tryb dyżurnego',
        startTimestamp: new Date(dispatcher[this.currentDispatcherIndex].timestampFrom),
        partySize: this.currentDispatcherIndex + 1,
        partyMax: dispatcher.length,
        buttons: [
          {
            label: 'Szczegóły scenerii',
            url: encodeURI(
              `https://stacjownik-td2.web.app/scenery?station=${dispatcher[this.currentDispatcherIndex].stationName}`
            )
          }
        ]
      })

      this.currentDispatcherIndex = ++this.currentDispatcherIndex % dispatcher.length
      this.lastPlayerName = dispatcher[0].dispatcherName
      return ['dispatcher', dispatcher[0].dispatcherName]
    }

    // await this.resetActivity()

    return ['not-found', '']
  }
}
