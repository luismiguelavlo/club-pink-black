<script setup lang="ts">
import { pickMixedRound, type MixedRoundType } from '~/data/party-chaos/cerebro-rounds'
import type { CerebroRoundType } from '~/types/party-chaos'

const emit = defineEmits<{
  finish: []
}>()

const { round, nextRound, isGameOver, players } = usePartyChaos()
const sounds = usePartySounds()

type SubGame = 'reto' | 'no-rias' | 'cerebro'

const currentSubGame = ref<SubGame>('reto')
const showRoundIntro = ref(true)
const gameOver = ref(false)

const ROUND_LABELS: Record<MixedRoundType, { emoji: string; title: string }> = {
  'reto': { emoji: '🤡', title: 'El Reto o Pierdes' },
  'no-rias': { emoji: '💀', title: 'No Te Rías' },
  'cerebro-memory': { emoji: '🧠', title: 'Cerebro — Memoria' },
  'cerebro-speed': { emoji: '⚡', title: 'Cerebro — Velocidad' },
  'cerebro-lie': { emoji: '🤥', title: 'Cerebro — Mentira' },
  'cerebro-challenge': { emoji: '🔥', title: 'Cerebro — Reto' },
  'cerebro-betrayal': { emoji: '😈', title: 'Cerebro — Traición' },
}

const currentRoundType = computed(() => pickMixedRound(round.value - 1))

const currentLabel = computed(() => ROUND_LABELS[currentRoundType.value])

const cerebroForcedType = computed((): CerebroRoundType | undefined => {
  const t = currentRoundType.value
  if (!t.startsWith('cerebro-')) return undefined
  return t.replace('cerebro-', '') as CerebroRoundType
})

function mapToSubGame(type: MixedRoundType): SubGame {
  if (type === 'reto') return 'reto'
  if (type === 'no-rias') return 'no-rias'
  return 'cerebro'
}

watch(currentRoundType, (type) => {
  currentSubGame.value = mapToSubGame(type)
}, { immediate: true })

function onRoundComplete() {
  if (isGameOver()) {
    gameOver.value = true
    return
  }
  nextRound()
  showRoundIntro.value = true
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4">
    <PartyChaosHud />

    <div
      v-if="showRoundIntro && !gameOver"
      class="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10 p-8 text-center"
    >
      <p class="text-4xl">
        {{ currentLabel.emoji }}
      </p>
      <p class="mt-2 font-headline-lg text-xl text-on-surface">
        Ronda {{ round }} — {{ currentLabel.title }}
      </p>
      <p class="mt-2 text-sm text-on-surface-variant">
        Party Chaos mezcla retos, risas y traición automáticamente
      </p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary"
        @click="showRoundIntro = false; sounds.startRound()"
      >
        ¡Empezar ronda!
      </button>
    </div>

    <RetoOPierdesGame
      v-else-if="!gameOver && currentSubGame === 'reto'"
      :key="`reto-${round}`"
      single-round
      @round-complete="onRoundComplete"
      @finish="emit('finish')"
    />

    <NoTeRiasGame
      v-else-if="!gameOver && currentSubGame === 'no-rias'"
      :key="`norias-${round}`"
      single-round
      @round-complete="onRoundComplete"
      @finish="emit('finish')"
    />

    <CerebroGrupoGame
      v-else-if="!gameOver && currentSubGame === 'cerebro'"
      :key="`cerebro-${round}`"
      single-round
      :forced-round-type="cerebroForcedType"
      @round-complete="onRoundComplete"
      @finish="emit('finish')"
    />

    <div
      v-else-if="gameOver"
      class="space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center"
    >
      <p class="text-4xl">
        🎮
      </p>
      <p class="font-headline-lg text-2xl text-on-surface">
        PARTY CHAOS — Fin
      </p>
      <p
        v-for="p in [...players].sort((a, b) => b.points - a.points)"
        :key="p.id"
        class="text-on-surface"
      >
        {{ p.name }} — 🏆 {{ p.points }} · ❤️ {{ p.lives }} · 🔥 {{ p.streak }}
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
