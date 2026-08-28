<script setup lang="ts">
import {
  buildCerebroRound,
  CEREBRO_ROUND_ORDER,
  type CerebroRound,
} from '~/data/party-chaos/cerebro-rounds'
import type { CerebroRoundType } from '~/types/party-chaos'

const props = defineProps<{
  singleRound?: boolean
  forcedRoundType?: CerebroRoundType
}>()

const emit = defineEmits<{
  finish: []
  roundComplete: []
}>()

const { players, config, round, loseLife, addPoints, nextRound, isGameOver, alivePlayers } =
  usePartyChaos()

type Phase =
  | 'handoff'
  | 'memory-show'
  | 'memory-answer'
  | 'speed'
  | 'lie'
  | 'challenge'
  | 'lie-vote'
  | 'betrayal-secret'
  | 'betrayal-vote'
  | 'result'
  | 'gameover'

const phase = ref<Phase>('handoff')
const activePlayer = ref<(typeof players.value)[0] | null>(null)
const currentRound = ref<CerebroRound | null>(null)
const roundType = ref<CerebroRoundType>('memory')
const selectedAnswer = ref<number | null>(null)
const speedTaps = ref<string[]>([])
const speedDone = ref(false)
const memoryTimeLeft = ref(5)
let timer: ReturnType<typeof setInterval> | null = null

const sounds = usePartySounds()
sounds.watchCountdown(memoryTimeLeft, 2)

function pickPlayer() {
  const alive = alivePlayers()
  if (!alive.length) return null
  return alive[(round.value - 1) % alive.length]!
}

function setupRound() {
  activePlayer.value = pickPlayer()
  roundType.value = props.forcedRoundType
    ?? CEREBRO_ROUND_ORDER[(round.value - 1) % CEREBRO_ROUND_ORDER.length]!
  const others = players.value
    .filter((p) => p.id !== activePlayer.value?.id)
    .map((p) => p.name)
  currentRound.value = buildCerebroRound(
    roundType.value,
    activePlayer.value?.name ?? '',
    others,
  )
  selectedAnswer.value = null
  speedTaps.value = []
  speedDone.value = false
}

function goToRoundPhase() {
  sounds.passPhone()
  if (!currentRound.value) return
  switch (currentRound.value.type) {
    case 'memory':
      phase.value = 'memory-show'
      memoryTimeLeft.value = 5
      timer = setInterval(() => {
        memoryTimeLeft.value -= 1
        if (memoryTimeLeft.value <= 0) {
          stopTimer()
          phase.value = 'memory-answer'
        }
      }, 1000)
      break
    case 'speed':
      phase.value = 'speed'
      break
    case 'lie':
      phase.value = 'lie'
      break
    case 'challenge':
      phase.value = 'challenge'
      break
    case 'betrayal':
      phase.value = 'betrayal-secret'
      break
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function submitMemoryAnswer(idx: number) {
  selectedAnswer.value = idx
  const r = currentRound.value
  if (r?.type === 'memory') {
    if (idx === r.correctIndex && activePlayer.value) {
      addPoints(activePlayer.value.id, 2)
      sounds.success()
    } else if (activePlayer.value) {
      loseLife(activePlayer.value.id)
      sounds.fail()
    }
  }
  phase.value = 'result'
}

function tapColor(colorId: string) {
  if (speedDone.value || currentRound.value?.type !== 'speed') return
  speedTaps.value.push(colorId)
  const expected = [...currentRound.value.colors].reverse().map((c) => c.id)
  const idx = speedTaps.value.length - 1
  if (speedTaps.value[idx] !== expected[idx]) {
    speedDone.value = true
    if (activePlayer.value) loseLife(activePlayer.value.id)
    sounds.fail()
    phase.value = 'result'
    return
  }
  if (speedTaps.value.length === expected.length) {
    speedDone.value = true
    if (activePlayer.value) addPoints(activePlayer.value.id, 3)
    sounds.success()
    phase.value = 'result'
  }
}

function betrayalSuccess() {
  if (activePlayer.value) addPoints(activePlayer.value.id, 3)
  phase.value = 'result'
}

function betrayalDiscovered() {
  if (activePlayer.value) addPoints(activePlayer.value.id, -2)
  phase.value = 'result'
}

function challengeDone(success: boolean) {
  if (!activePlayer.value) return
  if (success) addPoints(activePlayer.value.id, 2)
  else loseLife(activePlayer.value.id)
  phase.value = 'result'
}

function lieDiscovered(discovered: boolean) {
  if (!activePlayer.value) return
  if (discovered) loseLife(activePlayer.value.id)
  else addPoints(activePlayer.value.id, 2)
  phase.value = 'result'
}

function continueGame() {
  if (props.singleRound) {
    emit('roundComplete')
    return
  }
  if (isGameOver()) {
    phase.value = 'gameover'
    return
  }
  nextRound()
  setupRound()
  phase.value = 'handoff'
}

onMounted(() => {
  setupRound()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4">
    <PartyChaosHud />

    <div
      v-if="phase === 'handoff'"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="text-sm text-on-surface-variant">
        Ronda {{ round }} — Pasa el celular a
      </p>
      <p class="mt-2 font-headline-lg text-3xl text-primary">
        {{ activePlayer?.name }}
      </p>
      <p class="mt-2 text-sm capitalize text-on-surface-variant">
        {{ roundType === 'memory' ? '👀 Memoria' : '' }}
        {{ roundType === 'speed' ? '⚡ Velocidad' : '' }}
        {{ roundType === 'lie' ? '🤥 Mentira' : '' }}
        {{ roundType === 'challenge' ? '🔥 Reto' : '' }}
        {{ roundType === 'betrayal' ? '😈 Traición' : '' }}
      </p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary"
        @click="goToRoundPhase"
      >
        Listo
      </button>
    </div>

  <!-- Memoria -->
    <div
      v-else-if="phase === 'memory-show' && currentRound?.type === 'memory'"
      class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-8 text-center"
    >
      <p class="mb-4 text-on-surface-variant">
        Memoriza ({{ memoryTimeLeft }}s)
      </p>
      <div class="flex flex-wrap justify-center gap-4 text-5xl">
        <span
          v-for="(item, i) in currentRound.items"
          :key="i"
        >{{ item }}</span>
      </div>
    </div>

    <div
      v-else-if="phase === 'memory-answer' && currentRound?.type === 'memory'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <p class="font-headline-lg text-lg text-on-surface">
        {{ currentRound.question }}
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="(opt, i) in currentRound.options"
          :key="i"
          type="button"
          class="rounded-xl bg-surface-container-high py-4 text-3xl hover:bg-primary/20"
          @click="submitMemoryAnswer(i)"
        >
          {{ String.fromCharCode(65 + i) }}) {{ opt }}
        </button>
      </div>
    </div>

  <!-- Velocidad -->
    <div
      v-else-if="phase === 'speed' && currentRound?.type === 'speed'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-on-surface-variant">
        Toca los colores en orden <strong>inverso</strong>
      </p>
      <div class="flex justify-center gap-3 text-4xl">
        <span
          v-for="c in currentRound.colors"
          :key="c.id"
        >{{ c.emoji }}</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="c in currentRound.colors"
          :key="c.id"
          type="button"
          class="rounded-xl bg-surface-container-high py-4 text-3xl"
          :disabled="speedDone"
          @click="tapColor(c.id)"
        >
          {{ c.emoji }}
        </button>
      </div>
    </div>

  <!-- Mentira -->
    <div
      v-else-if="phase === 'lie' && currentRound?.type === 'lie'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <p class="text-center text-2xl">
        🤥 RONDA MENTIRA
      </p>
      <p class="text-center text-on-surface">
        {{ currentRound.prompt }}
      </p>
      <p class="text-center text-sm text-on-surface-variant">
        Cuando termines, pasa el celular al grupo para que adivinen cuál es la mentira.
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="phase = 'lie-vote'"
      >
        Listo — votar mentira
      </button>
    </div>

    <div
      v-else-if="phase === 'lie-vote' && roundType === 'lie'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-on-surface-variant">
        ¿Descubrieron la mentira de {{ activePlayer?.name }}?
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-xl bg-green-500/20 py-4"
          @click="lieDiscovered(true)"
        >
          ✅ Descubrieron la mentira
        </button>
        <button
          type="button"
          class="rounded-xl bg-error/20 py-4"
          @click="lieDiscovered(false)"
        >
          🤥 Engañó al grupo (+2)
        </button>
      </div>
    </div>

  <!-- Reto -->
    <div
      v-else-if="phase === 'challenge' && currentRound?.type === 'challenge'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <p class="text-center text-2xl">
        🤯 RETO
      </p>
      <p class="text-center text-lg text-on-surface">
        {{ currentRound.text }}
      </p>
      <p class="text-center text-sm text-on-surface-variant">
        {{ currentRound.seconds }} segundos
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-xl bg-green-500/20 py-4"
          @click="challengeDone(true)"
        >
          👍 Lo logró
        </button>
        <button
          type="button"
          class="rounded-xl bg-error/20 py-4"
          @click="challengeDone(false)"
        >
          👎 Falló
        </button>
      </div>
    </div>

  <!-- Traición -->
    <div
      v-else-if="phase === 'betrayal-secret' && currentRound?.type === 'betrayal'"
      class="space-y-4 rounded-2xl border border-error/40 bg-error/10 p-6"
    >
      <p class="text-center text-2xl">
        😈 MISIÓN SECRETA
      </p>
      <p class="text-center text-on-surface">
        {{ currentRound.mission }}
      </p>
      <p class="text-center text-sm text-on-surface-variant">
        Solo tú puedes ver esto. ¡No muestres la pantalla!
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="phase = 'betrayal-vote'"
      >
        Entendido — jugar misión
      </button>
    </div>

    <div
      v-else-if="phase === 'betrayal-vote' && currentRound?.type === 'betrayal'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-on-surface-variant">
        Pasa el celular al grupo. ¿Cómo terminó la misión de {{ activePlayer?.name }}?
      </p>
      <div class="grid gap-2">
        <button
          type="button"
          class="rounded-xl bg-green-500/20 py-3"
          @click="betrayalSuccess"
        >
          ✅ La cumplió (+3 pts)
        </button>
        <button
          type="button"
          class="rounded-xl bg-error/20 py-3"
          @click="betrayalDiscovered"
        >
          🕵️ La descubrieron (-2 pts)
        </button>
      </div>
    </div>

    <div
      v-else-if="phase === 'result'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-xl text-on-surface">
        Ronda completada
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="continueGame"
      >
        Siguiente ronda
      </button>
    </div>

    <div
      v-else-if="phase === 'gameover'"
      class="space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="font-headline-lg text-2xl">
        🧠 Fin — El cerebro del grupo
      </p>
      <p
        v-for="p in [...players].sort((a, b) => b.points - a.points)"
        :key="p.id"
      >
        {{ p.name }} — {{ p.points }} pts · {{ p.lives }} ❤️
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="emit('finish')"
      >
        Volver al menú
      </button>
    </div>
  </div>
</template>
