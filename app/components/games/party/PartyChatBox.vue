<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const { user } = useUserSession()
const open = ref(false)
const draft = ref('')
const listRef = ref<HTMLDivElement | null>(null)
const lastSeenCount = ref(0)

const messages = computed(() => props.room.chatMessages ?? [])
const unreadCount = computed(() => (open.value ? 0 : Math.max(0, messages.value.length - lastSeenCount.value)))

function scrollToBottom() {
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    lastSeenCount.value = messages.value.length
    nextTick(scrollToBottom)
  }
}

watch(
  () => messages.value.length,
  () => {
    if (open.value) {
      lastSeenCount.value = messages.value.length
      nextTick(scrollToBottom)
    }
  },
)

function submit() {
  const text = draft.value.trim()
  if (!text) return
  emit('send', text)
  draft.value = ''
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
    <div
      v-if="open"
      class="flex h-[420px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
        <p class="font-label-sm text-label-sm uppercase text-primary">
          Chat de la sala
        </p>
        <button
          type="button"
          class="text-on-surface-variant hover:text-on-surface"
          @click="toggle"
        >
          <MaterialIcon name="close" />
        </button>
      </div>

      <div
        ref="listRef"
        class="flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        <p
          v-if="messages.length === 0"
          class="mt-6 text-center text-sm text-on-surface-variant"
        >
          Nadie ha dicho nada todavía...
        </p>
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.userId === user?.id ? 'items-end' : 'items-start'"
        >
          <span class="mb-0.5 text-xs text-on-surface-variant">
            {{ msg.userId === user?.id ? 'Tú' : msg.name }} · {{ formatTime(msg.sentAt) }}
          </span>
          <span
            class="max-w-[85%] break-words rounded-xl px-3 py-2 text-sm"
            :class="msg.userId === user?.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'"
          >
            {{ msg.text }}
          </span>
        </div>
      </div>

      <form
        class="flex gap-2 border-t border-outline-variant/20 p-3"
        @submit.prevent="submit"
      >
        <input
          v-model="draft"
          type="text"
          maxlength="300"
          placeholder="Escribe un mensaje..."
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
        >
        <button
          type="submit"
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary disabled:opacity-50"
          :disabled="!draft.trim()"
        >
          <MaterialIcon name="send" class="text-lg" />
        </button>
      </form>
    </div>

    <button
      type="button"
      class="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_4px_20px_rgba(255,176,202,0.4)] transition-transform hover:scale-105"
      @click="toggle"
    >
      <MaterialIcon
        :name="open ? 'expand_more' : 'chat'"
        class="text-2xl"
      />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-bold text-on-error"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
  </div>
</template>
