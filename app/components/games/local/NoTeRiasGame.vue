<script setup lang="ts">
import {
  CHARACTER_ROLES,
  FORBIDDEN_WORDS,
  pickRandom,
} from '~/data/party-chaos/challenges'
import type { NoTeRiasMode } from '~/types/party-chaos'

const props = defineProps<{
  singleRound?: boolean
}>()

const emit = defineEmits<{
  finish: []
  roundComplete: []
}>()

const { players, config, round, loseLife, addPoints, nextRound, isGameOver, alivePlayers } =
  usePartyChaos()

const sounds = usePartySounds()

type Phase = 'handoff-target' | 'rules' | 'active' | 'timer' | 'result' | 'gameover'

const phase = ref<Phase>('handoff-target')
const target = ref<(typeof players.value)[0] | null>(null)
const mode = ref<NoTeRiasMode>('normal')
const character = ref<(typeof CHARACTER_ROLES)[0] | null>(null)
const forbiddenWord = ref('')
const timeLeft = ref(30)
sounds.watchCountdown(timeLeft)
let timer: ReturnType<typeof setInterval> | null = null

const MODE_LABELS: Record<NoTeRiasMode, { title: string; emoji: string; rules: string[] }> = {
  normal: {
    title: 'Modo normal',
    emoji: '😂',
    rules: [
      '🚫 No tocar al objetivo',
      '🚫 No insultar',
      '🚫 No usar el celular',
      '✅ Pueden hacer caras, hablar, actuar y contar chistes',
    ],
  },
  silence: {
    title: 'Modo silencio',
    emoji: '🤫',
    rules: [
      'Los demás NO pueden hablar',
      'Solo caras, gestos y actuación',
      '🚫 No tocar al objetivo',
    ],
  },
  character: {
    title: 'Modo personaje',
    emoji: '🎭',
    rules: [
      'Cada jugador actúa como un personaje asignado',
      'Deben hacer reír al objetivo en personaje',
      '🚫 No tocar al objetivo',
    ],
  },
  forbidden: {
    title: 'Palabra prohibida',
    emoji: '🚫',
    rules: [
      'El objetivo tiene una palabra prohibida',
      'Si la dice en voz alta: ¡perdió!',
      'Los demás intentan provocar que la diga',
    ],
  },
}

function pickTarget() {
  const alive = alivePlayers()
  if (!alive.length) return null
  return alive[(round.value - 1) % alive.length]!
}

function pickMode() {
  const modes = config.value.noTeRiasModes.length
    ? config.value.noTeRiasModes
    : (['normal'] as NoTeRiasMode[])
  return pickRandom(modes)
}

function setupRound() {
  target.value = pickTarget()
  mode.value = pickMode()
  character.value = mode.value === 'character' ? pickRandom(CHARACTER_ROLES) : null
  forbiddenWord.value = mode.value === 'forbidden' ? pickRandom(FORBIDDEN_WORDS) : ''
  timeLeft.value = 30
}

function startTimer() {
  sounds.startRound()
  phase.value = 'timer'
  timer = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      stopTimer()
      phase.value = 'result'
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function targetLaughed() {
  stopTimer()
  if (target.value) loseLife(target.value.id)
  sounds.fail()
  phase.value = 'result'
  survived.value = false
}

const survived = ref(true)

function targetSurvived() {
  stopTimer()
  if (target.value) {
    addPoints(target.value.id, 3)
  }
  sounds.success()
  survived.value = true
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
  phase.value = 'handoff-target'
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
      v-if="phase === 'handoff-target'"
      class="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="text-sm text-on-surface-variant">
        Pasa el celular a
      </p>
      <p class="mt-2 font-headline-lg text-3xl text-primary">
        {{ target?.name }}
      </p>
      <p class="mt-2 text-sm text-on-surface-variant">
        Eres el objetivo — no te rías
      </p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary"
        @click="phase = 'rules'"
      >
        Ver reglas
      </button>
    </div>

    <div
      v-else-if="phase === 'rules'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <p class="text-center text-2xl">
        {{ MODE_LABELS[mode].emoji }} {{ MODE_LABELS[mode].title }}
      </p>
      <p class="text-center font-headline-lg text-xl text-primary">
        😂 {{ target?.name?.toUpperCase() }} ES EL OBJETIVO
      </p>
      <ul class="space-y-2 text-sm text-on-surface-variant">
        <li
          v-for="(rule, i) in MODE_LABELS[mode].rules"
          :key="i"
        >
          {{ rule }}
        </li>
      </ul>
      <div
        v-if="mode === 'character' && character"
        class="rounded-xl bg-surface-container-high p-4 text-center"
      >
        <p class="text-sm text-on-surface-variant">
          Tu personaje
        </p>
        <p class="text-3xl">
          {{ character.emoji }}
        </p>
        <p class="font-bold text-on-surface">
          {{ character.name }}
        </p>
      </div>
      <div
        v-if="mode === 'forbidden'"
        class="rounded-xl border border-error/40 bg-error/10 p-4 text-center"
      >
        <p class="text-sm text-on-surface-variant">
          Palabra prohibida (solo tú la ves)
        </p>
        <p class="font-headline-lg text-2xl text-error">
          "{{ forbiddenWord }}"
        </p>
      </div>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="phase = 'active'"
      >
        Empezar — 30 segundos
      </button>
    </div>

    <div
      v-else-if="phase === 'active'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-on-surface-variant">
        Pasa el celular al grupo. Cuando estén listos:
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-4 text-lg text-on-primary"
        @click="startTimer"
      >
        ⏱️ ¡Iniciar cronómetro!
      </button>
    </div>

    <div
      v-else-if="phase === 'timer'"
      class="space-y-4"
    >
      <div class="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
        <p class="text-6xl font-bold text-primary">
          {{ timeLeft }}
        </p>
        <p class="mt-2 text-on-surface-variant">
          ¡Hagan reír a {{ target?.name }}!
        </p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-xl border-2 border-error bg-error/10 py-4 text-lg"
          @click="targetLaughed"
        >
          💀 Se rió
        </button>
        <button
          type="button"
          class="rounded-xl border-2 border-green-500/50 bg-green-500/10 py-4 text-lg"
          @click="targetSurvived"
        >
          🏆 Aguanta
        </button>
      </div>
    </div>

    <div
      v-else-if="phase === 'result'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-3xl">
        {{ survived ? '🏆 SOBREVIVIÓ +3 pts' : '💀 PERDIÓ UNA VIDA' }}
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="continueGame"
      >
        Siguiente jugador
      </button>
    </div>

    <div
      v-else-if="phase === 'gameover'"
      class="space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="font-headline-lg text-2xl">
        🏆 Fin del juego
      </p>
      <p
        v-for="p in [...players].sort((a, b) => b.points - a.points)"
        :key="p.id"
      >
        {{ p.name }} — {{ p.points }} pts
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
