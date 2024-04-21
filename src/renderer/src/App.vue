<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue'
import axios from 'axios'
import { PlayerActivityResponse } from '@shared/types/api'
import { PresenceMode } from '@shared/types/common'
import icon from '../../../resources/icon.png'
import { version } from '../../../package.json'

let nextFetchingTime = 0

const nickname = ref('')
const searchedNickname = ref('')
const updateStatus = ref('...')

const presenceMode = ref('disconnected') as Ref<PresenceMode>
const presenceUser = ref(null) as Ref<null | string>
const presenceError = ref(null) as Ref<null | string>

window.electron.ipcRenderer.on('presenceMode', (_event, args) => {
  presenceMode.value = args[0]
  presenceUser.value = args[1]

  if (args[2]) presenceError.value = args[2]
})

window.electron.ipcRenderer.on('updateStatus', (_event, args) => {
  updateStatus.value = args[0]
})

onMounted(() => {
  setInterval(() => {
    if (Date.now() >= nextFetchingTime) fetchPlayerData()
  }, 1000)
})

async function fetchPlayerData() {
  if (searchedNickname.value == '') return

  console.log('Fetching data...', searchedNickname)
  nextFetchingTime = Date.now() + 10000

  try {
    const response = await axios.get<PlayerActivityResponse>(
      `https://stacjownik.spythere.eu/api/getPlayerActivity?name=${searchedNickname.value}`
    )

    window.presence.runPresence(response.data)
  } catch (error) {
    console.error('Wystąpił błąd podczas pobierania danych!')
  }
}

function searchUser() {
  if (searchedNickname.value == nickname.value) return

  searchedNickname.value = nickname.value
  fetchPlayerData()
}

function resetPresence() {
  searchedNickname.value = ''
  nickname.value = ''

  window.presence.resetPresence()
}

function exit() {
  window.context.exitApp()
}
</script>

<template>
  <div class="app-container">
    <div class="logo">
      <img :src="icon" width="70" alt="" />
      <span>
        TD2 DISCORD <br />
        PRESENCE <sup style="font-size: 0.7em">v{{ version }}</sup>
      </span>
    </div>
    <div class="player-input">
      <input
        v-model="nickname"
        type="text"
        placeholder="Wpisz nick..."
        :disabled="searchedNickname != ''"
        @keydown.enter="searchUser"
      />
    </div>

    <div class="actions">
      <button class="action" @click="searchUser">Szukaj</button>
      <button class="action" @click="resetPresence">Resetuj</button>
      <button class="action" @click="exit">Wyjdź</button>
    </div>

    <div class="presence-status">
      <div class="connection" :class="presenceMode">
        Połączenie z Discordem:
        <span v-if="presenceMode == 'disconnected'">nieaktywne</span>
        <span v-else-if="presenceMode == 'error'"> błąd ({{ presenceError }}) </span>
        <span v-else>aktywne</span>
      </div>

      <div v-if="presenceMode == 'driver'" class="driver">Maszynista: {{ presenceUser }}</div>
      <div v-else-if="presenceMode == 'dispatcher'" class="dispatcher">
        Dyżurny: {{ presenceUser }}
      </div>
      <div v-else-if="presenceMode != 'error'" class="none">Nie wykryto użytkownika online</div>
    </div>

    <div>{{ updateStatus }}</div>
  </div>
</template>

<style scoped>
.app-container {
  text-align: center;
}

.logo {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  font-weight: bold;
  font-size: 1.2em;

  margin-bottom: 1em;
}

.player-input {
  margin-bottom: 1em;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.5em;
}

.presence-status {
  margin-top: 1em;
}

.connection {
  color: limegreen;
}

.connection.disconnected {
  color: #bbb;
}

.connection.error {
  color: firebrick;
}
</style>
