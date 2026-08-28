<script setup lang="ts">
type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

const open = ref(false)
const loading = ref(false)

const { data, refresh } = await useFetch<{
  items: NotificationItem[]
  unreadCount: number
}>('/api/notifications', {
  key: 'header-notifications',
  lazy: true,
  server: false,
})

const unreadCount = computed(() => data.value?.unreadCount ?? 0)
const items = computed(() => data.value?.items ?? [])

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

async function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    loading.value = true
    try {
      await refresh()
    }
    finally {
      loading.value = false
    }
  }
}

async function onSelect(item: NotificationItem) {
  if (!item.readAt) {
    await $fetch(`/api/notifications/${item.id}/read`, { method: 'POST' })
    await refresh()
  }
  open.value = false
  if (item.href) {
    await navigateTo(item.href)
  }
}

async function markAllRead() {
  await $fetch('/api/notifications/read-all', { method: 'POST' })
  await refresh()
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target?.closest('[data-notifications-root]')) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  void refresh()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div
    data-notifications-root
    class="relative"
  >
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
      aria-label="Notificaciones"
      @click.stop="toggleOpen"
    >
      <MaterialIcon name="notifications" />
      <span
        v-if="unreadCount > 0"
        class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,176,202,1)]"
      />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3">
        <p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
          Notificaciones
        </p>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="font-label-sm text-[10px] uppercase tracking-wider text-primary hover:underline"
          @click="markAllRead"
        >
          Marcar leídas
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <p
          v-if="loading"
          class="px-4 py-6 text-sm text-on-surface-variant"
        >
          Cargando…
        </p>
        <p
          v-else-if="!items.length"
          class="px-4 py-6 text-sm text-on-surface-variant"
        >
          Sin notificaciones por ahora.
        </p>
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="flex w-full flex-col gap-1 border-b border-outline-variant/10 px-4 py-3 text-left transition-colors hover:bg-primary/5"
          :class="item.readAt ? 'opacity-70' : ''"
          @click="onSelect(item)"
        >
          <div class="flex items-start justify-between gap-3">
            <p class="text-sm font-bold text-on-surface">
              {{ item.title }}
            </p>
            <span
              v-if="!item.readAt"
              class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            />
          </div>
          <p class="text-xs text-on-surface-variant">
            {{ item.body }}
          </p>
          <p class="font-label-sm text-[10px] uppercase tracking-wider text-primary/80">
            {{ relativeTime(item.createdAt) }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>
