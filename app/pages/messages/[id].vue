<script setup lang="ts">
type DirectMessage = {
  id: string
  body: string
  createdAt: string
  senderId: string
  isMine: boolean
}

type ConversationThread = {
  id: string
  peer: { id: string; name: string; avatarUrl: string | null }
  listingTitle: string | null
  messages: DirectMessage[]
}

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const conversationId = computed(() => route.params.id as string)

const { data, refresh, pending, error } = await useFetch<{ thread: ConversationThread }>(
  () => `/api/messages/${conversationId.value}`,
  { key: () => `messages-thread-${conversationId.value}`, watch: [conversationId] },
)

const thread = computed(() => data.value?.thread)
const draft = ref('')
const sending = ref(false)
const sendError = ref('')
const listRef = ref<HTMLDivElement | null>(null)

useSeoMeta({
  title: computed(() => `${thread.value?.peer.name ?? 'Chat'} | Pink & Black`),
})

function scrollToBottom() {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

watch(
  () => thread.value?.messages.length,
  () => nextTick(scrollToBottom),
)

let threadTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  scrollToBottom()
  threadTimer = setInterval(() => refresh(), 3000)
})

onUnmounted(() => {
  if (threadTimer) clearInterval(threadTimer)
})

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  const text = draft.value.trim()
  if (!text) return

  sending.value = true
  sendError.value = ''
  try {
    await $fetch(`/api/messages/${conversationId.value}`, {
      method: 'POST',
      body: { body: text },
    })
    draft.value = ''
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    sendError.value = e.data?.statusMessage ?? e.statusMessage ?? 'No se pudo enviar'
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] flex-col p-gutter-mobile md:p-gutter-desktop">
    <div class="mb-4 flex items-center gap-4">
      <NuxtLink
        to="/messages"
        class="flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-surface-container-high"
      >
        <MaterialIcon name="arrow_back" />
      </NuxtLink>
      <div
        v-if="thread"
        class="flex items-center gap-3"
      >
        <img
          v-if="thread.peer.avatarUrl"
          :src="thread.peer.avatarUrl"
          :alt="thread.peer.name"
          class="h-10 w-10 rounded-full object-cover"
        >
        <span
          v-else
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary"
        >
          {{ thread.peer.name.charAt(0) }}
        </span>
        <div>
          <h1 class="font-headline-lg text-lg text-on-surface">
            {{ thread.peer.name }}
          </h1>
          <p
            v-if="thread.listingTitle"
            class="text-xs text-primary"
          >
            {{ thread.listingTitle }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="pending && !thread"
      class="flex flex-1 items-center justify-center text-on-surface-variant"
    >
      Cargando chat...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-error/40 bg-error/10 p-6 text-center text-error"
    >
      No se pudo cargar la conversación.
    </div>

    <template v-else-if="thread">
      <div
        ref="listRef"
        class="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4"
      >
        <p
          v-if="thread.messages.length === 0"
          class="py-8 text-center text-sm text-on-surface-variant"
        >
          Empieza la conversación. Acuerden precio, entrega y forma de pago por fuera de la app.
        </p>
        <div
          v-for="msg in thread.messages"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.isMine ? 'items-end' : 'items-start'"
        >
          <span
            class="max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm"
            :class="msg.isMine ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'"
          >
            {{ msg.body }}
          </span>
          <span class="mt-1 text-xs text-on-surface-variant">
            {{ formatTime(msg.createdAt) }}
          </span>
        </div>
      </div>

      <form
        class="mt-4 flex gap-2"
        @submit.prevent="sendMessage"
      >
        <input
          v-model="draft"
          type="text"
          maxlength="1000"
          placeholder="Escribe un mensaje..."
          class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
        <button
          type="submit"
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary disabled:opacity-50"
          :disabled="sending || !draft.trim()"
        >
          <MaterialIcon name="send" />
        </button>
      </form>
      <p
        v-if="sendError"
        class="mt-2 text-sm text-error"
      >
        {{ sendError }}
      </p>
    </template>
  </div>
</template>
