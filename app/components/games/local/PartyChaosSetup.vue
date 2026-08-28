<script setup lang="ts">
import { CATEGORY_META, type ChallengeCategory, type NoTeRiasMode } from '~/types/party-chaos'
import type { Game } from '~/types/games'

const props = defineProps<{
  game?: Game
  showConfig?: boolean
}>()

const emit = defineEmits<{
  start: []
}>()

const {
  players,
  config,
  addPlayer,
  removePlayer,
  toggleCategory,
  toggleNoTeRiasMode,
} = usePartyChaos()

const { enabled: soundsEnabled, startRound: playStartSound } = usePartySounds()

const newName = ref('')
const showSettings = ref(props.showConfig ?? false)

const categories = Object.entries(CATEGORY_META) as [ChallengeCategory, { label: string; emoji: string }][]

function submitName() {
  if (addPlayer(newName.value)) {
    newName.value = ''
  }
}

const canStart = computed(() => players.value.length >= 2)
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div class="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 text-center">
      <p class="text-4xl">
        {{ game?.emoji ?? '🎮' }}
      </p>
      <h2 class="font-headline-lg text-2xl text-on-surface">
        {{ game?.title ?? 'PARTY CHAOS' }}
      </h2>
      <p class="mt-1 text-sm text-on-surface-variant">
        Pasa el celular · {{ game?.minPlayers ?? 2 }}-{{ game?.maxPlayers ?? 8 }} jugadores
      </p>
    </div>

    <PartyGameGuide
      v-if="game?.guide"
      :guide="game.guide"
      :emoji="game.emoji"
      :title="game.title"
    />

    <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
      <h3 class="mb-3 font-headline-lg text-lg text-on-surface">
        👥 Jugadores
      </h3>
      <form
        class="mb-4 flex gap-2"
        @submit.prevent="submitName"
      >
        <input
          v-model="newName"
          type="text"
          placeholder="Nombre del jugador"
          maxlength="20"
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
        <button
          type="submit"
          class="rounded-xl bg-primary px-4 py-3 text-on-primary disabled:opacity-50"
          :disabled="!newName.trim() || players.length >= 8"
        >
          <MaterialIcon name="add" />
        </button>
      </form>

      <ul
        v-if="players.length"
        class="space-y-2"
      >
        <li
          v-for="player in players"
          :key="player.id"
          class="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-2"
        >
          <span class="text-on-surface">{{ player.name }}</span>
          <button
            type="button"
            class="text-on-surface-variant hover:text-error"
            @click="removePlayer(player.id)"
          >
            <MaterialIcon name="close" />
          </button>
        </li>
      </ul>
      <p
        v-else
        class="text-center text-sm text-on-surface-variant"
      >
        Agrega al menos 2 jugadores
      </p>
    </div>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface"
      @click="showSettings = !showSettings"
    >
      <MaterialIcon name="settings" />
      {{ showSettings ? 'Ocultar configuración' : '⚙️ Configuración' }}
    </button>

    <div
      v-if="showSettings"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5"
    >
      <div class="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
        <span class="text-on-surface">🔊 Sonidos</span>
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-sm transition-colors"
          :class="soundsEnabled ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'"
          @click="soundsEnabled = !soundsEnabled"
        >
          {{ soundsEnabled ? 'Activados' : 'Silenciados' }}
        </button>
      </div>

      <div>
        <label class="mb-2 block text-sm text-on-surface-variant">❤️ Vidas iniciales</label>
        <input
          v-model.number="config.startingLives"
          type="range"
          min="1"
          max="5"
          class="w-full accent-primary"
        >
        <p class="text-center font-bold text-primary">
          {{ config.startingLives }}
        </p>
      </div>

      <div>
        <label class="mb-2 block text-sm text-on-surface-variant">🔥 Rondas totales</label>
        <input
          v-model.number="config.totalRounds"
          type="range"
          min="5"
          max="20"
          class="w-full accent-primary"
        >
        <p class="text-center font-bold text-primary">
          {{ config.totalRounds }}
        </p>
      </div>

      <div>
        <p class="mb-2 text-sm text-on-surface-variant">
          Mazo de retos
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="[cat, meta] in categories"
            :key="cat"
            type="button"
            class="rounded-full px-3 py-1.5 text-sm transition-colors"
            :class="config.categories.includes(cat)
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant'"
            @click="toggleCategory(cat)"
          >
            {{ meta.emoji }} {{ meta.label }}
          </button>
        </div>
      </div>

      <div>
        <p class="mb-2 text-sm text-on-surface-variant">
          Modos No Te Rías
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="mode in [
              { id: 'normal', label: '😂 Normal' },
              { id: 'silence', label: '🤫 Silencio' },
              { id: 'character', label: '🎭 Personaje' },
              { id: 'forbidden', label: '🚫 Palabra prohibida' },
            ]"
            :key="mode.id"
            type="button"
            class="rounded-full px-3 py-1.5 text-sm"
            :class="config.noTeRiasModes.includes(mode.id as NoTeRiasMode)
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant'"
            @click="toggleNoTeRiasMode(mode.id as NoTeRiasMode)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full rounded-xl bg-primary py-4 font-label-sm text-label-sm uppercase tracking-wider text-on-primary shadow-[0_0_20px_rgba(255,176,202,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,176,202,0.5)] disabled:opacity-50"
      :disabled="!canStart"
      @click="playStartSound(); emit('start')"
    >
      🎮 Jugar
    </button>
  </div>
</template>
