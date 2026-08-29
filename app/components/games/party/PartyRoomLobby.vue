<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'
import type { Game } from '~/types/games'

const props = defineProps<{
  room: PartyRoomView
  game: Game
}>()

const emit = defineEmits<{
  start: []
}>()

const { user } = useUserSession()
const isHost = computed(() => props.room.hostUserId === user.value?.id)
const canStart = computed(() => {
  const min = props.game.minPlayers ?? 2
  return props.room.players.length >= min
})

const codeCopied = ref(false)
const linkCopied = ref(false)

function copyCode() {
  navigator.clipboard.writeText(props.room.code)
  codeCopied.value = true
  setTimeout(() => { codeCopied.value = false }, 2000)
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}
</script>

<template>
  <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
    <div class="mb-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">
            Código de sala
          </p>
          <button
            type="button"
            class="font-headline-lg text-3xl tracking-[0.3em] text-primary transition-opacity active:opacity-60"
            :title="codeCopied ? '¡Copiado!' : 'Copiar código'"
            @click="copyCode"
          >
            {{ room.code }}
          </button>
          <p class="text-xs text-on-surface-variant">
            {{ codeCopied ? '¡Código copiado!' : 'Toca el código para copiar' }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-on-surface-variant">
            Jugadores
          </p>
          <p class="font-headline-lg text-2xl text-on-surface">
            {{ room.players.length }} / {{ game.maxPlayers }}
          </p>
        </div>
      </div>

      <!-- Share link -->
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        :class="linkCopied ? 'border-primary/40 bg-primary/10 text-primary' : 'text-on-surface-variant'"
        @click="copyLink"
      >
        <MaterialIcon :name="linkCopied ? 'check' : 'share'" class="text-base" />
        {{ linkCopied ? '¡Enlace copiado!' : 'Compartir enlace de invitación' }}
      </button>
    </div>

    <ul class="mb-6 space-y-2">
      <li
        v-for="player in room.players"
        :key="player.userId"
        class="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3"
      >
        <UserAvatar
          :name="player.name"
          :avatar-url="player.avatarUrl"
          size="sm"
        />
        <span class="flex-1 text-on-surface">{{ player.name }}</span>
        <span
          v-if="player.isHost"
          class="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary"
        >
          Anfitrión
        </span>
      </li>
    </ul>

    <p
      v-if="!canStart"
      class="mb-4 text-sm text-on-surface-variant"
    >
      Se necesitan al menos {{ game.minPlayers }} jugadores para empezar.
    </p>

    <button
      v-if="isHost"
      type="button"
      class="w-full rounded-xl bg-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)] disabled:opacity-50"
      :disabled="!canStart"
      @click="emit('start')"
    >
      Iniciar partida
    </button>
    <p
      v-else
      class="text-center text-on-surface-variant"
    >
      Esperando a que el anfitrión inicie...
    </p>
  </div>
</template>
