<script setup lang="ts">
import type { PartyGameId, PartyRoomSummary } from '#shared/types/party-games'
import { getGameById } from '~/data/games'

const props = withDefaults(
  defineProps<{
    /** Restrict the list to one game. Omit to browse every party game. */
    gameType?: PartyGameId
    title?: string
  }>(),
  {
    gameType: undefined,
    title: 'Salas activas',
  },
)

const { playingRooms, openRooms, loading, error, refresh } = usePartyRoomsList(props.gameType)

const joiningCode = ref<string | null>(null)
const joinError = ref<string | null>(null)

function gameOf(room: PartyRoomSummary) {
  return getGameById(room.gameType)
}

function relativeTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  return `hace ${Math.floor(minutes / 60)} h`
}

async function join(room: PartyRoomSummary) {
  if (room.full && !room.imIn) return
  joiningCode.value = room.code
  joinError.value = null

  try {
    if (!room.imIn) {
      await $fetch('/api/games/rooms/join', {
        method: 'POST',
        body: { code: room.code, gameType: room.gameType },
      })
    }
    await navigateTo(`/games/${room.gameType}/room/${room.code}`)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    joinError.value = e.data?.statusMessage ?? e.statusMessage ?? 'No se pudo unir a la sala'
    await refresh()
  }
  finally {
    joiningCode.value = null
  }
}
</script>

<template>
  <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
    <div class="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 class="font-headline-lg text-xl text-on-surface">
          {{ props.title }}
        </h2>
        <p class="text-sm text-on-surface-variant">
          Únete a una partida en curso y juegas en la siguiente ronda.
        </p>
      </div>
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
        aria-label="Actualizar salas"
        @click="refresh"
      >
        <MaterialIcon name="refresh" />
      </button>
    </div>

    <p
      v-if="joinError"
      class="mb-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
    >
      {{ joinError }}
    </p>

    <p
      v-if="loading"
      class="py-6 text-center text-on-surface-variant"
    >
      Buscando salas...
    </p>

    <p
      v-else-if="error"
      class="py-6 text-center text-sm text-error"
    >
      {{ error }}
    </p>

    <div
      v-else-if="!playingRooms.length && !openRooms.length"
      class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant/30 py-10 text-center"
    >
      <MaterialIcon
        name="meeting_room"
        class="text-3xl text-on-surface-variant/50"
      />
      <p class="text-on-surface-variant">
        No hay salas abiertas ahora mismo.
      </p>
      <p class="text-sm text-on-surface-variant/70">
        Crea una y aparecerá aquí para el resto del club.
      </p>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="group in [
          { key: 'waiting', label: 'Esperando jugadores', icon: 'hourglass_top', rooms: openRooms },
          { key: 'playing', label: 'Partidas en curso', icon: 'sports_esports', rooms: playingRooms },
        ].filter((g) => g.rooms.length)"
        :key="group.key"
      >
        <p class="mb-3 flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-primary">
          <MaterialIcon
            :name="group.icon"
            class="text-base"
          />
          {{ group.label }}
          <span class="text-on-surface-variant">({{ group.rooms.length }})</span>
        </p>

        <ul class="space-y-3">
          <li
            v-for="room in group.rooms"
            :key="room.code"
            class="flex flex-wrap items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
              :style="{ backgroundColor: (gameOf(room)?.color ?? '#ffb0ca') + '25' }"
            >
              {{ gameOf(room)?.emoji ?? '🎮' }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-headline-lg text-on-surface">
                  {{ gameOf(room)?.title ?? room.gameType }}
                </span>
                <span class="font-mono text-sm tracking-widest text-primary">{{ room.code }}</span>
                <span
                  v-if="room.status === 'playing'"
                  class="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary"
                >
                  <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Ronda {{ room.round }}
                </span>
                <span
                  v-else
                  class="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs text-on-surface-variant"
                >
                  En espera
                </span>
              </div>
              <p class="truncate text-sm text-on-surface-variant">
                {{ room.hostName }} · {{ room.playerCount }}/{{ room.maxPlayers }} jugadores
                <span v-if="room.waitingCount"> · {{ room.waitingCount }} en espera</span>
                · {{ relativeTime(room.updatedAt) }}
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-xl px-5 py-2.5 font-label-sm text-label-sm uppercase tracking-wider transition-all disabled:opacity-50"
              :class="
                room.imIn
                  ? 'border border-primary text-primary hover:bg-primary/10'
                  : 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]'
              "
              :disabled="joiningCode === room.code || (room.full && !room.imIn)"
              @click="join(room)"
            >
              <template v-if="joiningCode === room.code">
                ...
              </template>
              <template v-else-if="room.imIn">
                Volver
              </template>
              <template v-else-if="room.full">
                Llena
              </template>
              <template v-else-if="room.status === 'playing'">
                Ver y esperar
              </template>
              <template v-else>
                Unirse
              </template>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
