<script setup lang="ts">
type ConversationSummary = {
  id: string
  peer: { id: string; name: string; avatarUrl: string | null }
  listingTitle: string | null
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
}

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

useSeoMeta({ title: 'Mensajes | Pink & Black' })

const { data, pending, refresh, error } = await useFetch<{
  conversations: ConversationSummary[]
  unreadCount: number
}>('/api/messages', { key: 'messages-inbox' })

const conversations = computed(() => data.value?.conversations ?? [])

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

let inboxTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  inboxTimer = setInterval(() => refresh(), 5000)
})

onUnmounted(() => {
  if (inboxTimer) clearInterval(inboxTimer)
})
</script>

<template>
  <div class="space-y-6 p-gutter-mobile md:p-gutter-desktop">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="h-[2px] w-12 bg-primary" />
        <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">Privado</span>
      </div>
      <h1 class="font-headline-xl text-3xl text-on-surface">
        Mensajes
      </h1>
      <p class="text-sm text-on-surface-variant">
        Coordina compras y ventas del marketplace con otros pilotos.
      </p>
    </div>

    <div
      v-if="pending && !conversations.length"
      class="py-16 text-center text-on-surface-variant"
    >
      Cargando conversaciones...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-error/40 bg-error/10 p-6 text-center text-error"
    >
      No se pudieron cargar los mensajes.
    </div>

    <div
      v-else-if="conversations.length === 0"
      class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-12 text-center"
    >
      <p class="text-4xl">
        💬
      </p>
      <p class="mt-3 text-on-surface-variant">
        Aún no tienes conversaciones. Contacta a un vendedor desde el marketplace.
      </p>
      <NuxtLink
        to="/marketplace"
        class="mt-4 inline-block text-primary hover:underline"
      >
        Ir al marketplace
      </NuxtLink>
    </div>

    <ul
      v-else
      class="divide-y divide-outline-variant/20 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30"
    >
      <li
        v-for="conv in conversations"
        :key="conv.id"
      >
        <NuxtLink
          :to="`/messages/${conv.id}`"
          class="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-container-high/60"
        >
          <img
            v-if="conv.peer.avatarUrl"
            :src="conv.peer.avatarUrl"
            :alt="conv.peer.name"
            class="h-12 w-12 shrink-0 rounded-full object-cover"
          >
          <span
            v-else
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg text-primary"
          >
            {{ conv.peer.name.charAt(0) }}
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <p class="truncate font-medium text-on-surface">
                {{ conv.peer.name }}
              </p>
              <span class="shrink-0 text-xs text-on-surface-variant">
                {{ relativeTime(conv.lastMessageAt) }}
              </span>
            </div>
            <p
              v-if="conv.listingTitle"
              class="truncate text-xs text-primary"
            >
              Sobre: {{ conv.listingTitle }}
            </p>
            <p class="truncate text-sm text-on-surface-variant">
              {{ conv.lastMessage ?? 'Sin mensajes aún' }}
            </p>
          </div>

          <span
            v-if="conv.unreadCount > 0"
            class="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-on-primary"
          >
            {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
