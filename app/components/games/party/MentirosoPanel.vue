<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  action: [action: { type: 'submit_answer'; text: string } | { type: 'vote_answer'; optionId: string }]
}>()

const { user } = useUserSession()

const answer = ref('')

const me = computed(() => props.room.me)
const phase = computed(() => props.room.phase)
const totalRounds = computed(() => props.room.mentirosoTotalRounds ?? 6)

const answeredCount = computed(() => props.room.players.filter((p) => !!p.bluffAnswer).length)
const votedCount = computed(() => props.room.players.filter((p) => !!p.votedOptionId).length)

const sortedByPoints = computed(() =>
  [...props.room.players].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)),
)

const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  if (!props.room.phaseEndsAt) {
    secondsLeft.value = 0
    return
  }
  secondsLeft.value = Math.max(0, Math.ceil((props.room.phaseEndsAt - Date.now()) / 1000))
}

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch(() => props.room.phaseEndsAt, updateCountdown)

watch(() => props.room.round, () => {
  answer.value = ''
})

function submitAnswer() {
  if (!answer.value.trim()) return
  emit('action', { type: 'submit_answer', text: answer.value.trim() })
}

function voteFor(optionId: string) {
  emit('action', { type: 'vote_answer', optionId })
}

function playerName(userId: string | null | undefined) {
  if (!userId) return null
  return props.room.players.find((p) => p.userId === userId)?.name
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between rounded-xl bg-surface-container-high px-4 py-3">
      <span class="text-on-surface-variant">Ronda {{ room.round }}/{{ totalRounds }}</span>
      <span
        v-if="secondsLeft > 0 && phase !== 'mentiroso_reveal' && phase !== 'finished'"
        class="font-bold"
        :class="secondsLeft <= 10 ? 'text-error' : 'text-on-surface-variant'"
      >
        ⏱ {{ secondsLeft }}s
      </span>
    </div>

    <div
      v-if="room.message"
      class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-on-surface"
    >
      {{ room.message }}
    </div>

    <!-- ANSWER PHASE -->
    <template v-if="phase === 'mentiroso_answer'">
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center">
        <p class="mb-1 font-label-sm text-label-sm uppercase text-primary">
          Completa la frase
        </p>
        <p class="font-headline-lg text-xl text-on-surface">
          {{ room.mentirosoPrompt }}
        </p>
      </div>

      <div v-if="!me?.bluffAnswer" class="flex gap-2">
        <input
          v-model="answer"
          type="text"
          placeholder="Tu respuesta (invéntala creíble)"
          maxlength="60"
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          @keyup.enter="submitAnswer"
        >
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-3 text-on-primary disabled:opacity-50"
          :disabled="!answer.trim()"
          @click="submitAnswer"
        >
          Enviar
        </button>
      </div>
      <p v-else class="text-center text-on-surface-variant">
        Enviaste: <span class="font-medium text-primary">"{{ me.bluffAnswer }}"</span> · Esperando a los demás...
      </p>

      <p class="text-center text-sm text-on-surface-variant">
        {{ answeredCount }}/{{ room.players.length }} respondieron
      </p>
    </template>

    <!-- VOTING PHASE -->
    <template v-else-if="phase === 'mentiroso_voting'">
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center">
        <p class="mb-1 font-label-sm text-label-sm uppercase text-primary">
          ¿Cuál es la respuesta real?
        </p>
        <p class="font-headline-lg text-xl text-on-surface">
          {{ room.mentirosoPrompt }}
        </p>
      </div>

      <div v-if="!me?.votedOptionId" class="grid gap-2">
        <button
          v-for="option in room.mentirosoOptions"
          :key="option.id"
          type="button"
          class="rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-left text-on-surface transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="option.isMine"
          @click="voteFor(option.id)"
        >
          {{ option.text }}
          <span v-if="option.isMine" class="ml-2 text-xs text-on-surface-variant">(tu respuesta)</span>
        </button>
      </div>
      <p v-else class="text-center text-on-surface-variant">
        Voto enviado. Esperando a los demás...
      </p>

      <p class="text-center text-sm text-on-surface-variant">
        {{ votedCount }}/{{ room.players.length }} votaron
      </p>
    </template>

    <!-- REVEAL PHASE -->
    <template v-else-if="phase === 'mentiroso_reveal'">
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 text-center">
        <p class="mb-1 font-label-sm text-label-sm uppercase text-primary">
          {{ room.mentirosoPrompt }}
        </p>
        <p class="font-headline-lg text-2xl text-on-surface">
          Respuesta real: <span class="text-primary">{{ room.mentirosoRealAnswer }}</span>
        </p>
      </div>

      <div class="space-y-2">
        <div
          v-for="option in room.mentirosoOptions"
          :key="option.id"
          class="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          :class="option.authorId === null ? 'border-2 border-primary bg-primary/10' : 'bg-surface-container-high'"
        >
          <div>
            <p class="text-on-surface">
              {{ option.text }}
              <span v-if="option.authorId === null" class="ml-1 text-primary">✅ Real</span>
            </p>
            <p class="text-xs text-on-surface-variant">
              {{ option.authorId ? `Mentira de ${playerName(option.authorId)}` : 'La verdad' }}
            </p>
          </div>
          <span class="rounded-full bg-surface-container-highest px-3 py-1 text-sm text-on-surface">
            {{ option.votes ?? 0 }} 🗳
          </span>
        </div>
      </div>
    </template>

    <!-- FINISHED -->
    <template v-else-if="phase === 'finished'">
      <div class="rounded-2xl border border-primary/40 bg-primary/10 p-6 text-center">
        <p class="text-2xl">
          🏆 {{ room.winnerName }} es el mejor mentiroso
        </p>
      </div>
    </template>

    <!-- SCOREBOARD -->
    <div v-if="phase !== 'mentiroso_answer'" class="space-y-2">
      <h3 class="font-headline-lg text-lg text-on-surface">
        Puntuación
      </h3>
      <div
        v-for="(player, i) in sortedByPoints"
        :key="player.userId"
        class="flex items-center gap-3 rounded-xl px-4 py-3"
        :class="player.userId === user?.id ? 'bg-primary/10' : 'bg-surface-container-high'"
      >
        <span class="w-5 text-center text-on-surface-variant">{{ i + 1 }}</span>
        <UserAvatar :name="player.name" :avatar-url="player.avatarUrl" size="sm" />
        <span class="flex-1 text-on-surface">{{ player.name }}</span>
        <span class="font-bold text-primary">{{ player.points ?? 0 }} pts</span>
      </div>
    </div>
  </div>
</template>
