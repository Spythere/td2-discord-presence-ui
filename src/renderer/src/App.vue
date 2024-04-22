<script setup lang="ts">
import { reactive, ref } from 'vue'
import icon from '../../../resources/icon.png'
import { version } from '../../../package.json'
import { PresenceModeDataIPC } from '@shared/types/ipc'

const nickname = ref('')
const searchedNickname = ref('')

const presenceData = reactive({ connected: false }) as PresenceModeDataIPC

window.electron.ipcRenderer.on('presenceMode', (_event, args) => {
  const payback = args[0] as PresenceModeDataIPC

  presenceData['activityType'] = payback['activityType']
  presenceData['activityUser'] = payback['activityUser']
  presenceData['connected'] = payback['connected']
  presenceData['discordUsername'] = payback['discordUsername']
  presenceData['error'] = payback['error']
})

async function fetchPlayerData() {
  if (searchedNickname.value == '') return

  window.presence.startPresence(searchedNickname.value)
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
      <div
        class="connection"
        :data-error="presenceData.error !== undefined"
        :data-connected="presenceData.connected"
      >
        <span v-if="presenceData.error">
          Błąd podczas łączenia z Discordem ({{ presenceData.error }})
        </span>
        <span v-else-if="presenceData.connected == false">Brak połączenia z Discordem</span>
        <span v-else>
          Połączenie z Discordem aktywne (użytkownik: {{ presenceData.discordUsername }})
        </span>
      </div>

      <div v-if="presenceData.activityType == 'driver'" class="driver">
        Maszynista: {{ presenceData.activityUser }}
      </div>

      <div v-else-if="presenceData.activityType == 'dispatcher'" class="dispatcher">
        Dyżurny: {{ presenceData.activityUser }}
      </div>

      <div v-else-if="presenceData.activityType == 'none'">
        Oczekiwanie na gracza <i>{{ searchedNickname }}</i
        >...
      </div>

      <div v-else>...</div>
    </div>
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
  min-height: 60px;
}

.connection {
  color: limegreen;
}

.connection[data-connected='false'] {
  color: #bbb;
}

.connection[data-error='true'] {
  color: firebrick;
}
</style>
