import axios from 'axios'
import { PlayerActivityResponse } from '../shared/types/api'

export const http = axios.create({
  baseURL: 'https://stacjownik.spythere.eu'
})

export async function fetchPresenceData(playerName: string) {
  return http.get<PlayerActivityResponse>('/api/getPlayerActivity', {
    params: { name: playerName }
  })
}
