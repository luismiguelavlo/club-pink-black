<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  action: [action: { type: 'pass_bomb'; targetUserId: string } | { type: 'steal_bomb'; targetUserId: string }]
}>()

const { user } = useUserSession()

const hasBomb = computed(() => props.room.bombHolderId === user.value?.id)
const showFakeBomb = computed(() => {
  const id = user.value?.id
  return id && props.room.fakeBombHolderIds.includes(id) && !hasBomb.value
})
const isExploded = computed(() => props.room.phase === 'bomba_exploded')

function passTo(targetUserId: string) {
  emit('action', { type: 'pass_bomb', targetUserId })
}

function stealFrom(holderId: string) {
  emit('action', { type: 'steal_bomb', targetUserId: holderId })
}

function playerHasBomb(playerId: string) {
  if (props.room.bombHolderId === playerId) return true
  if (props.room.fakeBombHolderIds.includes(playerId)) return true
  return false
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="room.message"
      class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center"
      :class="{ 'animate-pulse border-error/50 bg-error/20': isExploded }"
    >
      {{ room.message }}
    </div>

    <div class="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
      <span class="text-on-surface-variant">Ronda {{ room.round }}</span>
      <span class="text-on-surface-variant">Dificultad {{ room.difficultyLevel }}/5</span>
    </div>

    <div
      v-if="hasBomb"
      class="rounded-2xl border-2 border-error bg-error/20 p-6 text-center"
      :class="{ 'animate-pulse': room.bombUrgent }"
    >
      <p class="text-5xl">
        💣
      </p>
      <p class="mt-2 font-headline-lg text-xl text-error">
        ¡Tienes la bomba!
      </p>
      <p
        v-if="room.bombSecondsLeft !== null && room.bombSecondsLeft !== undefined"
        class="mt-1 text-3xl font-bold text-on-surface"
      >
        ~{{ room.bombDisplaySeconds }}s
      </p>
      <p class="mt-1 text-xs text-on-surface-variant">
        (El temporizador real es secreto — ¡pásala rápido!)
      </p>
      <p
        v-if="room.bombSecondsLeft !== null"
        class="mt-2 text-sm text-error"
      >
        Urgencia real: {{ room.bombSecondsLeft }}s
      </p>
    </div>

    <div
      v-else-if="showFakeBomb"
      class="rounded-2xl border-2 border-error/50 bg-error/10 p-6 text-center animate-pulse"
    >
      <p class="text-5xl">
        💣
      </p>
      <p class="mt-2 text-error">
        ¿Bomba falsa? ¡Igual pásala por si acaso!
      </p>
    </div>

    <div class="space-y-2">
      <h3 class="font-headline-lg text-lg text-on-surface">
        Jugadores
      </h3>
      <div
        v-for="player in room.players"
        :key="player.userId"
        class="flex items-center gap-3 rounded-xl px-4 py-3"
        :class="[
          player.alive ? 'bg-surface-container-high' : 'bg-surface-container-high/40 opacity-50',
          playerHasBomb(player.userId) && player.alive ? 'ring-2 ring-error' : '',
          player.frozenUntil && player.frozenUntil > Date.now() ? 'opacity-60' : '',
        ]"
      >
        <UserAvatar
          :name="player.name"
          :avatar-url="player.avatarUrl"
          size="sm"
        />
        <div class="flex-1">
          <p class="text-on-surface">
            {{ player.name }}
            <span v-if="player.shield">🛡️</span>
            <span v-if="player.frozenUntil && player.frozenUntil > Date.now()">🧊</span>
          </p>
          <div class="flex gap-1">
            <MaterialIcon
              v-for="i in 3"
              :key="i"
              name="favorite"
              class="text-sm"
              :class="i <= player.lives ? 'text-error' : 'text-outline-variant'"
            />
          </div>
        </div>
        <span
          v-if="playerHasBomb(player.userId) && player.alive"
          class="text-2xl"
        >
          💣
        </span>
        <button
          v-if="hasBomb && player.alive && player.userId !== user?.id && !isExploded"
          type="button"
          class="rounded-lg bg-primary px-3 py-1.5 text-sm text-on-primary"
          @click="passTo(player.userId)"
        >
          Pasar
        </button>
        <button
          v-else-if="room.difficultyLevel >= 5 && !hasBomb && player.userId === room.bombHolderId && player.alive && !isExploded"
          type="button"
          class="rounded-lg border border-error px-3 py-1.5 text-sm text-error"
          @click="stealFrom(player.userId)"
        >
          Robar 💨
        </button>
      </div>
    </div>

    <div
      v-if="room.phase === 'finished'"
      class="rounded-xl bg-primary/10 p-6 text-center"
    >
      <p class="text-2xl">
        🏆 {{ room.winnerName }} gana
      </p>
    </div>
  </div>
</template>
