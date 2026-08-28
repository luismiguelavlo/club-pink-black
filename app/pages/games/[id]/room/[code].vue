<script setup lang="ts">
import { getGameById } from '~/data/games'
import type { PartyGameAction } from '#shared/types/party-games'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const gameId = route.params.id as string
const code = (route.params.code as string).toUpperCase()
const game = getGameById(gameId)

if (!game || game.mode !== 'multiplayer') {
  throw createError({ statusCode: 404, message: 'Juego no encontrado' })
}

useSeoMeta({
  title: `${game.title} — Sala ${code} | Pink & Black`,
})

const { room, loading, error, startGame, sendAction, leaveRoom } = usePartyGameRoom(code)
const starting = ref(false)
const actionError = ref<string | null>(null)

async function handleStart() {
  starting.value = true
  try {
    await startGame()
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string }; statusMessage?: string }
    actionError.value = fetchError.data?.message ?? fetchError.statusMessage ?? 'No se pudo iniciar'
  } finally {
    starting.value = false
  }
}

async function handleAction(action: PartyGameAction) {
  actionError.value = null
  try {
    await sendAction(action)
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string }; statusMessage?: string }
    actionError.value = fetchError.data?.message ?? fetchError.statusMessage ?? 'Acción fallida'
  }
}

async function goBack() {
  await leaveRoom()
  navigateTo(`/games/${gameId}`)
}

onBeforeUnmount(() => {
  leaveRoom()
})
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="h-1 w-full overflow-hidden bg-surface-container-highest">
      <div class="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(255,176,202,1)]" />
    </div>

    <div class="p-gutter-mobile md:p-gutter-desktop">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
            @click="goBack"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <div>
            <h1 class="font-headline-lg text-2xl text-on-surface md:text-3xl">
              {{ game.emoji }} {{ game.title }}
            </h1>
            <p class="font-label-sm text-label-sm uppercase text-primary">
              Sala {{ code }} · Multijugador
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="loading"
        class="py-20 text-center text-on-surface-variant"
      >
        Conectando a la sala...
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        {{ error }}
      </div>

      <template v-else-if="room">
        <p
          v-if="room.gameType !== gameId"
          class="rounded-xl border border-error/40 bg-error/10 p-6 text-center text-error"
        >
          Este código pertenece a otro juego.
        </p>

        <template v-else>
        <p
          v-if="actionError"
          class="mb-4 text-center text-sm text-error"
        >
          {{ actionError }}
        </p>

        <PartyRoomLobby
          v-if="room.status === 'lobby'"
          :room="room"
          :game="game"
          @start="handleStart"
        />

        <InfiltradoPanel
          v-else-if="gameId === 'infiltrado'"
          :room="room"
          @action="handleAction"
        />

        <BombaPanel
          v-else-if="gameId === 'bomba'"
          :room="room"
          @action="handleAction"
        />

        <NoPisoPanel
          v-else-if="gameId === 'no-piso'"
          :room="room"
          @action="handleAction"
        />
        </template>
      </template>
    </div>
  </div>
</template>
