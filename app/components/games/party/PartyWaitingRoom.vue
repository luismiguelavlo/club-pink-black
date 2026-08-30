<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'
import type { Game } from '~/types/games'

const props = defineProps<{
  room: PartyRoomView
  game: Game
}>()

const { user } = useUserSession()

const isHost = computed(() => props.room.hostUserId === user.value?.id)
const matchOver = computed(() => props.room.status === 'finished')
</script>

<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center">
      <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
        <MaterialIcon
          :name="matchOver ? 'replay' : 'hourglass_top'"
          class="text-2xl text-primary"
        />
      </div>
      <h2 class="font-headline-lg text-xl text-on-surface">
        {{ matchOver ? 'Entras en la próxima partida' : 'Partida en curso' }}
      </h2>
      <p class="mt-2 text-on-surface-variant">
        <template v-if="matchOver">
          {{ isHost ? 'Inicia la siguiente partida cuando todos estén listos.' : 'El anfitrión iniciará otra partida en breve y ya jugarás.' }}
        </template>
        <template v-else>
          Te uniste con la ronda empezada, así que juegas en la siguiente.
          Mientras tanto puedes hablar con el grupo por el chat.
        </template>
      </p>
    </div>

    <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">
            Sala
          </p>
          <p class="font-headline-lg text-2xl tracking-[0.25em] text-primary">
            {{ room.code }}
          </p>
        </div>
        <div class="text-right">
          <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">
            {{ matchOver ? 'Estado' : `Ronda ${room.round}` }}
          </p>
          <p class="font-headline-lg text-xl text-on-surface">
            {{ matchOver ? 'Terminada' : 'Jugando' }}
          </p>
        </div>
      </div>

      <p
        v-if="room.message"
        class="mb-5 rounded-xl bg-surface-container-high px-4 py-3 text-center text-on-surface-variant"
      >
        {{ room.message }}
      </p>

      <p class="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-primary">
        En la partida ({{ room.players.length }}/{{ game.maxPlayers }})
      </p>
      <ul class="mb-6 space-y-2">
        <li
          v-for="player in room.players"
          :key="player.userId"
          class="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-2.5"
          :class="player.alive ? '' : 'opacity-50'"
        >
          <UserAvatar
            :name="player.name"
            :avatar-url="player.avatarUrl"
            size="sm"
          />
          <span class="flex-1 truncate text-on-surface">{{ player.name }}</span>
          <span
            v-if="!player.alive"
            class="text-xs text-on-surface-variant"
          >
            Eliminado
          </span>
        </li>
      </ul>

      <p class="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        Esperando la próxima ({{ room.waitingPlayers.length }})
      </p>
      <ul class="space-y-2">
        <li
          v-for="player in room.waitingPlayers"
          :key="player.userId"
          class="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant/30 px-4 py-2.5"
        >
          <UserAvatar
            :name="player.name"
            :avatar-url="player.avatarUrl"
            size="sm"
          />
          <span class="flex-1 truncate text-on-surface">{{ player.name }}</span>
          <span
            v-if="player.userId === user?.id"
            class="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary"
          >
            Tú
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
