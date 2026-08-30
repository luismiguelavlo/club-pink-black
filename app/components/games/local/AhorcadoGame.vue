<script setup lang="ts">
import {
  HANGMAN_ALPHABET,
  HANGMAN_CATEGORY_META,
  MAX_HANGMAN_MISTAKES,
  isWordComplete,
  letterInWord,
  normalizeWord,
  pickHangmanEntry,
  type HangmanCategory,
  type HangmanEntry,
} from '~/data/party-chaos/hangman-words'

const emit = defineEmits<{
  finish: []
}>()

const {
  players,
  round,
  loseLife,
  addPoints,
  nextRound,
  isGameOver,
  alivePlayers,
  startGame,
} = usePartyChaos()

const sounds = usePartySounds()

type Phase = 'category' | 'handoff' | 'playing' | 'won' | 'lost' | 'gameover'

const phase = ref<Phase>('category')
const activePlayer = ref<(typeof players.value)[0] | null>(null)
const currentEntry = ref<HangmanEntry | null>(null)
const guessedLetters = ref<Set<string>>(new Set())
const wrongCount = ref(0)
const lastGuesser = ref<(typeof players.value)[0] | null>(null)
const usedEntryIds = ref<string[]>([])

const selectedCategories = ref<HangmanCategory[]>(
  Object.keys(HANGMAN_CATEGORY_META) as HangmanCategory[],
)

const categoryOptions = Object.entries(HANGMAN_CATEGORY_META) as [
  HangmanCategory,
  { label: string; emoji: string },
][]

const mistakesLeft = computed(() => MAX_HANGMAN_MISTAKES - wrongCount.value)

const displayWord = computed(() => {
  if (!currentEntry.value) return ''
  return normalizeWord(currentEntry.value.word)
    .split('')
    .map((char) => {
      if (char === ' ') return ' '
      return guessedLetters.value.has(char) ? char : '_'
    })
    .join(' ')
})

function pickActivePlayer() {
  const alive = alivePlayers()
  if (alive.length === 0) return null
  const idx = (round.value - 1) % alive.length
  return alive[idx]!
}

function toggleCategory(category: HangmanCategory) {
  if (selectedCategories.value.includes(category)) {
    if (selectedCategories.value.length === 1) return
    selectedCategories.value = selectedCategories.value.filter((c) => c !== category)
  }
  else {
    selectedCategories.value = [...selectedCategories.value, category]
  }
}

function beginCategories() {
  if (!selectedCategories.value.length) return
  phase.value = 'handoff'
  startRound()
}

function startRound() {
  activePlayer.value = pickActivePlayer()
  currentEntry.value = pickHangmanEntry(selectedCategories.value, usedEntryIds.value)
  usedEntryIds.value.push(currentEntry.value.id)
  guessedLetters.value = new Set()
  wrongCount.value = 0
  lastGuesser.value = null
  phase.value = 'handoff'
}

function beginPlaying() {
  phase.value = 'playing'
  sounds.startRound()
}

function guessLetter(letter: string) {
  if (phase.value !== 'playing' || !activePlayer.value || !currentEntry.value) return
  if (guessedLetters.value.has(letter)) return

  guessedLetters.value = new Set([...guessedLetters.value, letter])
  lastGuesser.value = activePlayer.value

  if (letterInWord(currentEntry.value.word, letter)) {
    sounds.tick()
    if (isWordComplete(currentEntry.value.word, guessedLetters.value)) {
      addPoints(activePlayer.value.id, 3)
      sounds.success()
      phase.value = 'won'
      return
    }
  }
  else {
    wrongCount.value += 1
    sounds.fail()
    if (wrongCount.value >= MAX_HANGMAN_MISTAKES) {
      loseLife(activePlayer.value.id)
      phase.value = 'lost'
      return
    }
  }

  const alive = alivePlayers()
  if (alive.length === 0) {
    phase.value = 'gameover'
    return
  }

  const currentIdx = alive.findIndex((p) => p.id === activePlayer.value?.id)
  const nextIdx = (currentIdx + 1) % alive.length
  activePlayer.value = alive[nextIdx]!
}

function continueGame() {
  if (isGameOver()) {
    phase.value = 'gameover'
    return
  }
  nextRound()
  startRound()
}

function playAgain() {
  startGame('ahorcado')
  usedEntryIds.value = []
  phase.value = 'category'
}

onMounted(() => {
  if (players.value.length < 2) {
    emit('finish')
  }
})
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4">
    <PartyChaosHud />

    <!-- Category picker (first time) -->
    <div
      v-if="phase === 'category'"
      class="space-y-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <div class="text-center">
        <p class="text-4xl">
          🪢
        </p>
        <h2 class="mt-2 font-headline-lg text-xl text-on-surface">
          Elige las categorías
        </h2>
        <p class="mt-1 text-sm text-on-surface-variant">
          Las palabras saldrán solo de las categorías activas.
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <button
          v-for="[id, meta] in categoryOptions"
          :key="id"
          type="button"
          class="rounded-xl border px-3 py-2 text-sm transition-colors"
          :class="
            selectedCategories.includes(id)
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
          "
          @click="toggleCategory(id)"
        >
          {{ meta.emoji }} {{ meta.label }}
        </button>
      </div>

      <button
        type="button"
        class="w-full rounded-xl bg-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
        @click="beginCategories"
      >
        Empezar
      </button>
    </div>

    <!-- Handoff -->
    <div
      v-else-if="phase === 'handoff'"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <MaterialIcon
        name="smartphone"
        class="mb-3 text-4xl text-primary"
      />
      <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">
        Pasa el celular a
      </p>
      <h2 class="mt-2 font-headline-lg text-3xl text-primary">
        {{ activePlayer?.name }}
      </h2>
      <p
        v-if="currentEntry"
        class="mt-4 text-sm text-on-surface-variant"
      >
        {{ HANGMAN_CATEGORY_META[currentEntry.category].emoji }}
        {{ HANGMAN_CATEGORY_META[currentEntry.category].label }}
        · Pista: {{ currentEntry.hint }}
      </p>
      <p class="mt-2 text-xs text-on-surface-variant">
        No muestres la pantalla a los demás hasta que estés listo.
      </p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary"
        @click="beginPlaying"
      >
        Listo, adivinar
      </button>
    </div>

    <template v-else-if="phase === 'playing' || phase === 'won' || phase === 'lost'">
      <!-- Hangman drawing -->
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
        <div class="mb-3 flex items-center justify-between text-sm">
          <span class="text-on-surface-variant">
            Turno: <span class="font-medium text-primary">{{ activePlayer?.name }}</span>
          </span>
          <span class="text-on-surface-variant">
            Errores: {{ wrongCount }}/{{ MAX_HANGMAN_MISTAKES }}
          </span>
        </div>

        <svg
          viewBox="0 0 200 220"
          class="mx-auto h-44 w-full max-w-xs"
          aria-hidden="true"
        >
          <!-- Gallows -->
          <line
            x1="20"
            y1="200"
            x2="140"
            y2="200"
            stroke="rgba(255,255,255,0.2)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <line
            x1="50"
            y1="200"
            x2="50"
            y2="20"
            stroke="rgba(255,255,255,0.2)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <line
            x1="50"
            y1="20"
            x2="120"
            y2="20"
            stroke="rgba(255,255,255,0.2)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <line
            x1="120"
            y1="20"
            x2="120"
            y2="45"
            stroke="rgba(255,255,255,0.2)"
            stroke-width="4"
            stroke-linecap="round"
          />

          <!-- Body parts -->
          <circle
            v-if="wrongCount >= 1"
            cx="120"
            cy="62"
            r="16"
            fill="none"
            stroke="#ff4d94"
            stroke-width="3"
          />
          <line
            v-if="wrongCount >= 2"
            x1="120"
            y1="78"
            x2="120"
            y2="130"
            stroke="#ff4d94"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            v-if="wrongCount >= 3"
            x1="120"
            y1="95"
            x2="95"
            y2="115"
            stroke="#ff4d94"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            v-if="wrongCount >= 4"
            x1="120"
            y1="95"
            x2="145"
            y2="115"
            stroke="#ff4d94"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            v-if="wrongCount >= 5"
            x1="120"
            y1="130"
            x2="100"
            y2="165"
            stroke="#ff4d94"
            stroke-width="3"
            stroke-linecap="round"
          />
          <line
            v-if="wrongCount >= 6"
            x1="120"
            y1="130"
            x2="140"
            y2="165"
            stroke="#ff4d94"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>

        <p class="text-center font-label-sm text-label-sm uppercase text-on-surface-variant">
          {{ currentEntry ? HANGMAN_CATEGORY_META[currentEntry.category].label : '' }}
          · {{ mistakesLeft }} intentos restantes
        </p>
      </div>

      <!-- Word -->
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-high/60 p-6 text-center">
        <p class="break-all font-mono text-3xl tracking-[0.35em] text-on-surface md:text-4xl">
          {{ displayWord }}
        </p>
        <p
          v-if="currentEntry && phase === 'playing'"
          class="mt-3 text-sm text-on-surface-variant"
        >
          💡 {{ currentEntry.hint }}
        </p>
      </div>

      <!-- Keyboard -->
      <div
        v-if="phase === 'playing'"
        class="grid grid-cols-7 gap-2 sm:grid-cols-9"
      >
        <button
          v-for="letter in HANGMAN_ALPHABET"
          :key="letter"
          type="button"
          class="rounded-xl border py-2.5 font-label-sm text-label-sm transition-colors disabled:opacity-40"
          :class="
            guessedLetters.has(letter)
              ? letterInWord(currentEntry?.word ?? '', letter)
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-error/30 bg-error/10 text-error'
              : 'border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-primary/10'
          "
          :disabled="guessedLetters.has(letter)"
          @click="guessLetter(letter)"
        >
          {{ letter }}
        </button>
      </div>

      <!-- Round result -->
      <div
        v-if="phase === 'won'"
        class="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center"
      >
        <p class="text-4xl">
          🎉
        </p>
        <h3 class="mt-2 font-headline-lg text-xl text-primary">
          ¡Palabra descubierta!
        </h3>
        <p class="mt-1 text-on-surface">
          {{ normalizeWord(currentEntry?.word ?? '') }}
        </p>
        <p class="mt-2 text-sm text-on-surface-variant">
          +3 puntos para {{ lastGuesser?.name }}
        </p>
        <button
          type="button"
          class="mt-5 rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary"
          @click="continueGame"
        >
          Siguiente ronda
        </button>
      </div>

      <div
        v-else-if="phase === 'lost'"
        class="rounded-2xl border border-error/30 bg-error/10 p-6 text-center"
      >
        <p class="text-4xl">
          💀
        </p>
        <h3 class="mt-2 font-headline-lg text-xl text-error">
          ¡Ahorcado!
        </h3>
        <p class="mt-1 text-on-surface">
          La palabra era: <span class="font-bold text-primary">{{ normalizeWord(currentEntry?.word ?? '') }}</span>
        </p>
        <p class="mt-2 text-sm text-on-surface-variant">
          {{ lastGuesser?.name }} pierde una vida
        </p>
        <button
          type="button"
          class="mt-5 rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary"
          @click="continueGame"
        >
          Siguiente ronda
        </button>
      </div>
    </template>

    <!-- Game over -->
    <div
      v-else-if="phase === 'gameover'"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="text-5xl">
        🏆
      </p>
      <h2 class="mt-3 font-headline-lg text-2xl text-on-surface">
        Fin del juego
      </h2>
      <ul class="mt-4 space-y-2">
        <li
          v-for="(player, index) in [...players].sort((a, b) => b.points - a.points)"
          :key="player.id"
          class="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-2"
        >
          <span class="text-on-surface">
            {{ index + 1 }}. {{ player.name }}
          </span>
          <span class="text-primary">🏆 {{ player.points }}</span>
        </li>
      </ul>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          class="rounded-xl border border-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-primary"
          @click="emit('finish')"
        >
          Salir
        </button>
        <button
          type="button"
          class="rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary"
          @click="playAgain"
        >
          Jugar de nuevo
        </button>
      </div>
    </div>
  </div>
</template>
