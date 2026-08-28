<script setup lang="ts">
import type { Game } from '~/types/games'

const props = defineProps<{
  game: Game
}>()

const emit = defineEmits<{
  created: [code: string]
}>()

const joinCode = ref('')
const creating = ref(false)
const joining = ref(false)
const error = ref<string | null>(null)

async function createRoom() {
  creating.value = true
  error.value = null
  try {
    const data = await $fetch<{ room: { code: string } }>('/api/games/rooms', {
      method: 'POST',
      body: { gameType: props.game.id },
    })
    emit('created', data.room.code)
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string }; statusMessage?: string }
    error.value = fetchError.data?.message ?? fetchError.statusMessage ?? 'No se pudo crear la sala'
  } finally {
    creating.value = false
  }
}

async function joinRoom() {
  if (!joinCode.value.trim()) return
  joining.value = true
  error.value = null
  try {
    const data = await $fetch<{ room: { code: string } }>('/api/games/rooms/join', {
      method: 'POST',
      body: { code: joinCode.value.trim(), gameType: props.game.id },
    })
    emit('created', data.room.code)
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string }; statusMessage?: string }
    error.value = fetchError.data?.message ?? fetchError.statusMessage ?? 'No se pudo unir a la sala'
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6">
    <div class="mb-6 flex items-center gap-4">
      <div
        class="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        :style="{ backgroundColor: game.color + '25' }"
      >
        {{ game.emoji }}
      </div>
      <div>
        <h2 class="font-headline-lg text-2xl text-on-surface">
          {{ game.title }}
        </h2>
        <p class="text-sm text-on-surface-variant">
          {{ game.minPlayers }}-{{ game.maxPlayers }} jugadores · Multijugador
        </p>
      </div>
    </div>

    <p class="mb-6 text-on-surface-variant leading-relaxed">
      {{ game.guide?.summary ?? game.description }}
    </p>

    <div class="mb-4 flex gap-4 text-sm">
      <div class="rounded-xl bg-surface-container-high px-4 py-2">
        <span class="text-on-surface-variant">Diversión</span>
        <div class="text-primary">
          <span v-for="i in (game.funRating ?? 5)" :key="i">⭐</span>
        </div>
      </div>
      <div class="rounded-xl bg-surface-container-high px-4 py-2">
        <span class="text-on-surface-variant">Dificultad</span>
        <div class="font-bold text-on-surface">
          {{ game.difficulty }}/10
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)] disabled:opacity-60"
        :disabled="creating"
        @click="createRoom"
      >
        <MaterialIcon name="add" />
        {{ creating ? 'Creando...' : 'Crear sala' }}
      </button>

      <div class="flex gap-2">
        <input
          v-model="joinCode"
          type="text"
          placeholder="Código de sala"
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 uppercase tracking-widest text-on-surface outline-none focus:border-primary"
          maxlength="8"
        >
        <button
          type="button"
          class="rounded-xl border border-primary px-4 py-3 font-label-sm text-label-sm uppercase text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          :disabled="joining || !joinCode.trim()"
          @click="joinRoom"
        >
          {{ joining ? '...' : 'Unirse' }}
        </button>
      </div>

      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
