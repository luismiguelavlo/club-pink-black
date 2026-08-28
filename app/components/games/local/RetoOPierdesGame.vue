<script setup lang="ts">
import { CATEGORY_META } from '~/types/party-chaos'
import { pickChallenge } from '~/data/party-chaos/challenges'

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

type Phase = 'handoff' | 'challenge' | 'timer' | 'vote' | 'result' | 'gameover'

const phase = ref<Phase>('handoff')
const activePlayer = ref<(typeof players.value)[0] | null>(null)
const currentChallenge = ref<ReturnType<typeof pickChallenge> | null>(null)
const timeLeft = ref(0)
sounds.watchCountdown(timeLeft)
const passVotes = ref(0)
const failVotes = ref(0)
const usedChallenges = ref<string[]>([])
let timer: ReturnType<typeof setInterval> | null = null

function pickActivePlayer() {
  const alive = alivePlayers()
  if (alive.length === 0) return null
  const idx = (round.value - 1) % alive.length
  return alive[idx]!
}

function startRound() {
  activePlayer.value = pickActivePlayer()
  currentChallenge.value = pickChallenge(config.value.categories, usedChallenges.value)
  if (currentChallenge.value) {
    usedChallenges.value.push(currentChallenge.value.id)
  }
  passVotes.value = 0
  failVotes.value = 0
  phase.value = 'challenge'
}

function beginTimer() {
  if (!currentChallenge.value) return
  sounds.startRound()
  timeLeft.value = currentChallenge.value.seconds
  phase.value = 'timer'
  timer = setInterval(() => {
    timeLeft.value -= 1
    if (timeLeft.value <= 0) {
      stopTimer()
      phase.value = 'vote'
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function vote(result: 'pass' | 'fail') {
  if (result === 'pass') passVotes.value += 1
  else failVotes.value += 1

  const voters = players.value.length - 1
  if (passVotes.value + failVotes.value >= voters) {
    resolveVote()
  }
}

function resolveVote() {
  const failed = failVotes.value > passVotes.value
  if (failed && activePlayer.value) {
    loseLife(activePlayer.value.id)
    sounds.fail()
  } else if (activePlayer.value) {
    addPoints(activePlayer.value.id, 2)
    sounds.success()
  }
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
  phase.value = 'handoff'
}

onMounted(() => {
  startRound()
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
        Pasa el celular a
      </p>
      <p class="mt-2 font-headline-lg text-3xl text-primary">
        {{ activePlayer?.name }}
      </p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary"
        @click="sounds.passPhone(); phase = 'challenge'"
      >
        Listo, soy yo
      </button>
    </div>

    <div
      v-else-if="phase === 'challenge' && currentChallenge"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <span class="rounded-full bg-surface-container-high px-3 py-1 text-sm text-primary">
        {{ CATEGORY_META[currentChallenge.category].emoji }}
        {{ CATEGORY_META[currentChallenge.category].label }}
      </span>
      <p class="text-sm text-on-surface-variant">
        🔥 RETO PARA {{ activePlayer?.name?.toUpperCase() }}
      </p>
      <p class="font-headline-lg text-xl text-on-surface">
        {{ currentChallenge.text }}
      </p>
      <p class="text-sm text-on-surface-variant">
        Tienes {{ currentChallenge.seconds }} segundos
      </p>
      <button
        type="button"
        class="w-full rounded-xl bg-primary py-3 text-on-primary"
        @click="beginTimer"
      >
        ¡Empezar reto!
      </button>
    </div>

    <div
      v-else-if="phase === 'timer'"
      class="rounded-2xl border border-error/40 bg-error/10 p-8 text-center"
    >
      <p class="text-6xl font-bold text-error">
        {{ timeLeft }}
      </p>
      <p class="mt-2 text-on-surface-variant">
        ¡Haz el reto!
      </p>
    </div>

    <div
      v-else-if="phase === 'vote'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6"
    >
      <p class="text-center text-on-surface-variant">
        👥 Los demás deciden — pasa el celular
      </p>
      <p class="text-center font-headline-lg text-lg text-on-surface">
        ¿{{ activePlayer?.name }} lo logró?
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-xl border-2 border-green-500/50 bg-green-500/10 py-6 text-2xl transition-colors hover:bg-green-500/20"
          @click="vote('pass')"
        >
          👍 Lo logró
          <span class="mt-1 block text-sm">{{ passVotes }}</span>
        </button>
        <button
          type="button"
          class="rounded-xl border-2 border-error/50 bg-error/10 py-6 text-2xl transition-colors hover:bg-error/20"
          @click="vote('fail')"
        >
          👎 No lo logró
          <span class="mt-1 block text-sm">{{ failVotes }}</span>
        </button>
      </div>
    </div>

    <div
      v-else-if="phase === 'result'"
      class="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center"
    >
      <p class="text-2xl">
        {{ failVotes > passVotes ? '💀 Perdió una vida' : '🏆 ¡Reto superado! +2 pts' }}
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
      <p class="text-4xl">
        🏆
      </p>
      <p class="font-headline-lg text-2xl text-on-surface">
        ¡Fin del juego!
      </p>
      <p
        v-for="p in [...players].sort((a, b) => b.points - a.points)"
        :key="p.id"
        class="text-on-surface"
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
