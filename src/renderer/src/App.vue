<script setup lang="ts">
import { Ref, ref } from 'vue'
import icon from '../../../resources/icon.png'
import { version } from '../../../package.json'
import { ActivityType, Connection } from '../../shared/types/common'

const nickname = ref('')
const searchedNickname = ref('')

const discordUsername = ref('')
const connection = ref('not-connected') as Ref<Connection>
const activityType = ref('idle') as Ref<ActivityType>
const activityUser = ref('')
const errorMsg = ref('')

window.electron.ipcRenderer.on('activity', (_event, args) => {
  console.log('Activity:', args)

  activityType.value = args[0] as ActivityType
  activityUser.value = args[1]

  errorMsg.value = args[2] ?? ''
})

window.electron.ipcRenderer.on('saved-playername', (_event, args) => {
  console.log('Saved player name:', args[0])

  nickname.value = args[0]
})

window.electron.ipcRenderer.on('connection', (_event, args) => {
  console.log('Connection:', args)

  connection.value = args[0]
  errorMsg.value = args[1] ?? ''
})

window.electron.ipcRenderer.on('discord-username', (_event, args) => {
  console.log('Discord username:', args)

  discordUsername.value = args[0]
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
      <div class="connection" :data-error="errorMsg != ''" :data-connected="connection">
        <span v-if="errorMsg != ''"> Błąd podczas łączenia z Discordem ({{ errorMsg }}) </span>
        <span v-else-if="connection == 'not-connected'">Brak połączenia z Discordem</span>
        <span v-else> Połączenie z Discordem aktywne (użytkownik: {{ discordUsername }}) </span>
      </div>

      <div v-if="activityType == 'driver'" class="driver">Maszynista: {{ activityUser }}</div>

      <div v-else-if="activityType == 'dispatcher'" class="dispatcher">
        Dyżurny: {{ activityUser }}
      </div>

      <div v-else-if="activityType == 'not-found'">
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

.connection[data-connected='connected'] {
  color: limegreen;
}

.connection[data-connected='not-connected'] {
  color: #bbb;
}

.connection[data-connected='error'] {
  color: firebrick;
}
</style>
