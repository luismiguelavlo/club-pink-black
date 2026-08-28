<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  action: [action: { type: 'submit_clue'; clue: string } | { type: 'vote'; targetUserId: string } | { type: 'guess_word'; word: string }]
}>()

const clue = ref('')
const guess = ref('')
const { user } = useUserSession()

const me = computed(() => props.room.me)
const isInfiltrator = computed(() => props.room.isInfiltrator)
const phase = computed(() => props.room.phase)

function submitClue() {
  if (!clue.value.trim()) return
  emit('action', { type: 'submit_clue', clue: clue.value.trim() })
  clue.value = ''
}

function vote(targetUserId: string) {
  emit('action', { type: 'vote', targetUserId })
}

function submitGuess() {
  if (!guess.value.trim()) return
  emit('action', { type: 'guess_word', word: guess.value.trim() })
  guess.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="room.message"
      class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-on-surface"
    >
      {{ room.message }}
    </div>

    <div
      v-if="room.secretWord && phase !== 'infiltrado_reveal'"
      class="rounded-xl bg-surface-container-high p-4 text-center"
    >
      <p class="text-sm text-on-surface-variant">
        Palabra secreta
      </p>
      <p class="font-headline-lg text-3xl text-primary">
        {{ room.secretWord }}
      </p>
    </div>

    <div
      v-if="isInfiltrator && phase === 'infiltrado_clues'"
      class="rounded-xl border border-error/40 bg-error/10 p-4 text-center"
    >
      <p class="text-lg">
        🕵️ Eres el <strong>infiltrado</strong>
      </p>
      <p class="text-sm text-on-surface-variant">
        No conoces la palabra. Escribe una pista que suene convincente.
      </p>
    </div>

    <div v-if="phase === 'infiltrado_clues'">
      <div
        v-if="!me?.clue"
        class="flex gap-2"
      >
        <input
          v-model="clue"
          type="text"
          placeholder="Tu pista (una palabra o frase corta)"
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          maxlength="40"
          @keyup.enter="submitClue"
        >
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-3 text-on-primary"
          @click="submitClue"
        >
          Enviar
        </button>
      </div>
      <p
        v-else
        class="text-center text-on-surface-variant"
      >
        Pista enviada. Esperando a los demás...
      </p>
    </div>

    <div
      v-if="room.players.some((p) => p.clue)"
      class="space-y-2"
    >
      <h3 class="font-headline-lg text-lg text-on-surface">
        Pistas
      </h3>
      <div
        v-for="player in room.players.filter((p) => p.clue)"
        :key="player.userId"
        class="flex items-center gap-3 rounded-xl bg-surface-container-high px-4 py-3"
      >
        <UserAvatar
          :name="player.name"
          :avatar-url="player.avatarUrl"
          size="sm"
        />
        <span class="text-on-surface">{{ player.name }}:</span>
        <span class="font-medium text-primary">"{{ player.clue }}"</span>
      </div>
    </div>

    <div v-if="phase === 'infiltrado_voting'">
      <h3 class="mb-3 font-headline-lg text-lg text-on-surface">
        ¿Quién es el infiltrado?
      </h3>
      <div class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="player in room.players.filter((p) => p.userId !== user?.id)"
          :key="player.userId"
          type="button"
          class="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 transition-colors hover:border-primary disabled:opacity-50"
          :disabled="!!me?.voteTargetId"
          @click="vote(player.userId)"
        >
          <UserAvatar
            :name="player.name"
            :avatar-url="player.avatarUrl"
            size="sm"
          />
          <span>{{ player.name }}</span>
          <MaterialIcon
            v-if="me?.voteTargetId === player.userId"
            name="check_circle"
            class="ml-auto text-primary"
          />
        </button>
      </div>
    </div>

    <div
      v-if="phase === 'infiltrado_guess' && isInfiltrator"
      class="space-y-3"
    >
      <p class="text-center text-on-surface">
        Te escaparon. ¡Adivina la palabra secreta para ganar!
      </p>
      <div class="flex gap-2">
        <input
          v-model="guess"
          type="text"
          placeholder="Tu respuesta"
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 uppercase text-on-surface outline-none focus:border-primary"
          @keyup.enter="submitGuess"
        >
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-3 text-on-primary"
          @click="submitGuess"
        >
          Adivinar
        </button>
      </div>
    </div>

    <div
      v-if="phase === 'infiltrado_reveal' || phase === 'finished'"
      class="rounded-xl border border-outline-variant/20 bg-surface-container-high p-6 text-center"
    >
      <p class="mb-2 text-2xl">
        {{ room.roundResult?.winner === 'infiltrator' ? '🕵️ Gana el infiltrado' : '🎉 Ganan los civiles' }}
      </p>
      <p class="mb-4 text-on-surface-variant">
        {{ room.roundResult?.reason }}
      </p>
      <p
        v-if="room.secretWord"
        class="font-headline-lg text-xl text-primary"
      >
        La palabra era: {{ room.secretWord }}
      </p>
      <p
        v-if="room.infiltratorId"
        class="mt-2 text-sm text-on-surface-variant"
      >
        Infiltrado:
        {{ room.players.find((p) => p.userId === room.infiltratorId)?.name }}
      </p>
    </div>
  </div>
</template>
