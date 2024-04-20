<script setup lang="ts">
import { Ref, ref } from 'vue'
import { PlayerActivity } from './types/common'
import { PlayerActivityResponse } from './types/api'

const nickname = ref('')
const searchedNickname = ref('')

const presenceMode = ref('disconnected')
const presenceUser = ref(null) as Ref<null | string>

let interval: number | undefined = undefined

const ipcRunPresence = (data: PlayerActivity) =>
  window.electron.ipcRenderer.send('runPresence', [data])

const ipcResetPresence = () => window.electron.ipcRenderer.send('resetPresence')
const ipcExit = () => window.electron.ipcRenderer.send('exit')

window.electron.ipcRenderer.on('presenceMode', (_event, args) => {
  presenceMode.value = args[0]
  presenceUser.value = args[1]
})

async function fetchPlayerData() {
  if (nickname.value == '') return

  console.log('Fetching data...', searchedNickname)

  try {
    const data = (await (
      await fetch(
        `https://stacjownik.spythere.eu/api/getPlayerActivity?name=${searchedNickname.value}`
      )
    ).json()) as PlayerActivityResponse

    ipcRunPresence(data)
  } catch (error) {
    console.error('Wystąpił błąd podczas pobierania danych!')
  }
}

function scheduleDataRefresh() {
  if (searchedNickname.value == nickname.value) return

  searchedNickname.value = nickname.value

  fetchPlayerData()

  if (!interval)
    interval = window.setInterval(() => {
      fetchPlayerData()
    }, 5000)
}

function resetPresence() {
  if (interval) {
    window.clearInterval(interval)
    interval = undefined
  }

  searchedNickname.value = ''
  nickname.value = ''

  ipcResetPresence()
}

function exit() {
  ipcExit()
}
</script>

<template>
  <div class="app-container">
    <div class="player-input">
      <input
        v-model="nickname"
        type="text"
        placeholder="Wpisz nick..."
        :disabled="searchedNickname != ''"
        @keydown.enter="scheduleDataRefresh"
      />
    </div>

    <div class="actions">
      <button class="action" @click="scheduleDataRefresh">Szukaj</button>
      <button class="action" @click="resetPresence">Reset</button>
      <button class="action" @click="exit">Wyjdź</button>
    </div>

    <div class="presence-status">Status Presence: {{ presenceMode }} {{ presenceUser }}</div>
  </div>
</template>

<style scoped>
.app-container {
  text-align: center;
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
  margin-top: 0.5em;
}
</style>
