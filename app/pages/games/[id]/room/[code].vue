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

const { room, loading, error, errorStatus, startGame, sendAction, sendChatMessage, leaveRoom, refresh, startPolling } = usePartyGameRoom(code)
const starting = ref(false)
const actionError = ref<string | null>(null)

const notInRoom = computed(() => errorStatus.value === 403)

const { user } = useUserSession()
const isHost = computed(() => room.value?.hostUserId === user.value?.id)
const isWaiting = computed(() => room.value?.me?.waiting === true)

const joining = ref(false)
const joinError = ref<string | null>(null)

async function joinFromLink() {
  joining.value = true
  joinError.value = null
  try {
    await $fetch('/api/games/rooms/join', {
      method: 'POST',
      body: { code, gameType: gameId },
    })
    await refresh()
    startPolling()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    joinError.value = e.data?.statusMessage ?? e.statusMessage ?? 'No se pudo unir a la sala'
  }
  finally {
    joining.value = false
  }
}

async function handleStart() {
  starting.value = true
  actionError.value = null
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

async function handleChatSend(text: string) {
  try {
    await sendChatMessage(text)
  } catch {
    // Chat failures shouldn't block the game UI; the next poll will resync.
  }
}

async function goBack() {
  await leaveRoom()
  navigateTo(`/games/${gameId}`)
}

watch(
  () => [room.value?.status, room.value?.phase, gameId] as const,
  ([status, phase, id]) => {
    if (id === 'hockey-aire-online' && status === 'playing' && phase !== 'finished') {
      startPolling(100)
    }
    else {
      startPolling(1200)
    }
  },
)

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

      <!-- Invited via link but not in the room yet -->
      <div
        v-else-if="notInRoom"
        class="flex flex-col items-center gap-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-8 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <MaterialIcon name="meeting_room" class="text-3xl text-primary" />
        </div>
        <div class="space-y-1">
          <h2 class="font-headline-lg text-xl text-on-surface">
            {{ game.emoji }} {{ game.title }}
          </h2>
          <p class="text-on-surface-variant">
            Te invitaron a la sala <span class="font-mono font-bold text-primary">{{ code }}</span>
          </p>
        </div>
        <p
          v-if="joinError"
          class="text-sm text-error"
        >
          {{ joinError }}
        </p>
        <button
          type="button"
          class="rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)] disabled:opacity-50"
          :disabled="joining"
          @click="joinFromLink"
        >
          {{ joining ? 'Uniéndome...' : 'Unirme a la sala' }}
        </button>
        <NuxtLink
          :to="`/games/${gameId}`"
          class="text-sm text-on-surface-variant hover:text-on-surface"
        >
          Volver a los juegos
        </NuxtLink>
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

        <PartyWaitingRoom
          v-else-if="isWaiting"
          :room="room"
          :game="game"
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

        <MentirosoPanel
          v-else-if="gameId === 'mentiroso'"
          :room="room"
          @action="handleAction"
        />

        <AirHockeyOnlinePanel
          v-else-if="gameId === 'hockey-aire-online'"
          :room="room"
          @action="handleAction"
        />

        <div
          v-if="room.status === 'finished' && (isHost || !isWaiting)"
          class="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center"
        >
          <p
            v-if="!isHost"
            class="text-on-surface-variant"
          >
            Esperando a que el anfitrión inicie otra partida...
          </p>
          <button
            v-else
            type="button"
            class="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)] disabled:opacity-50"
            :disabled="starting"
            @click="handleStart"
          >
            <MaterialIcon name="replay" />
            {{ starting ? 'Iniciando...' : 'Jugar otra vez' }}
          </button>
        </div>

        <PartyChatBox
          :room="room"
          @send="handleChatSend"
        />
        </template>
      </template>
    </div>
  </div>
</template>
