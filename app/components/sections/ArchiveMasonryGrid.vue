<script setup lang="ts">
import type { ArchiveMediaItem, GalleryFilter } from '~/types/site'

const props = withDefaults(
  defineProps<{
    filter?: GalleryFilter
  }>(),
  {
    filter: 'all',
  },
)

const PAGE_SIZE = 24

type MediaResponse = {
  items: ArchiveMediaItem[]
  total: number
  hasMore: boolean
}

const items = ref<ArchiveMediaItem[]>([])
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')

async function fetchPage(offset: number, append: boolean) {
  const response = await $fetch<MediaResponse>('/api/public/media', {
    query: {
      kind: props.filter,
      limit: PAGE_SIZE,
      offset,
    },
  })

  items.value = append ? [...items.value, ...response.items] : response.items
  hasMore.value = response.hasMore
}

async function loadInitial() {
  loading.value = true
  error.value = ''

  try {
    await fetchPage(0, false)
  }
  catch {
    error.value = 'No se pudo cargar el archivo multimedia.'
    items.value = []
    hasMore.value = false
  }
  finally {
    loading.value = false
  }
}

async function onLoadMore() {
  if (!hasMore.value || loadingMore.value) return

  loadingMore.value = true
  error.value = ''

  try {
    await fetchPage(items.value.length, true)
  }
  catch {
    error.value = 'No se pudo cargar más contenido.'
  }
  finally {
    loadingMore.value = false
  }
}

watch(
  () => props.filter,
  () => {
    void loadInitial()
  },
  { immediate: true },
)
</script>

<template>
  <section class="mb-section-gap px-gutter-desktop">
    <p
      v-if="loading"
      class="font-body-md py-16 text-center text-secondary"
    >
      Cargando archivo…
    </p>

    <template v-else>
      <div
        v-if="items.length > 0"
        class="masonry-grid gap-4"
      >
        <MasonryMediaCard
          v-for="item in items"
          :key="item.id"
          :item="item"
        />
      </div>

      <p
        v-else
        class="font-body-md py-16 text-center text-secondary"
      >
        Aún no hay contenido en este filtro.
      </p>

      <p
        v-if="error"
        class="font-body-md mt-6 text-center text-sm text-error"
      >
        {{ error }}
      </p>

      <div
        v-if="hasMore"
        class="mt-16 flex justify-center"
      >
        <LoadMoreButton
          :label="loadingMore ? 'CARGANDO…' : 'VISTA COMPLETA'"
          @load="onLoadMore"
        />
      </div>
    </template>
  </section>
</template>
