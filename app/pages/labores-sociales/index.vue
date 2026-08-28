<script setup lang="ts">
import type { SocialWorkPreview } from '~/types/site'
import { footerLinks, getNavLinksForPath } from '~/data/site'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

useSeoMeta({
  title: 'Labores Sociales | PINK & BLACK ROAD RIDER CLUB',
  description:
    'Acciones sociales y comunitarias del Pink & Black Road Rider Club: apoyo escolar, donaciones y presencia en la calle.',
  ogTitle: 'Labores Sociales | PINK & BLACK ROAD RIDER CLUB',
  ogDescription:
    'Conoce las iniciativas sociales del club más allá de la carretera.',
})

const items = ref<SocialWorkPreview[]>([])
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')

async function fetchPage(offset: number, append: boolean) {
  const response = await $fetch<{
    items: SocialWorkPreview[]
    hasMore: boolean
  }>('/api/public/labores-sociales/archivo', {
    query: { limit: 12, offset },
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
    error.value = 'No se pudieron cargar las labores sociales.'
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

onMounted(() => {
  void loadInitial()
})
</script>

<template>
  <AppPageShell
    :links="links"
    :footer-links="footerLinks"
    footer-highlight-brand
    navbar-cta-variant="primary-container"
    navbar-cta-shape="chamfer"
    show-glow
    main-class="pt-32"
  >
    <section class="px-gutter-mobile pb-12 md:px-gutter-desktop">
      <div class="mx-auto max-w-7xl">
        <span class="mb-4 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          Impacto comunitario
        </span>
        <h1 class="max-w-3xl font-headline-xl text-3xl text-on-background md:text-headline-xl">
          LABORES
          <span class="text-primary-container drop-shadow-[0_0_15px_rgba(255,71,156,0.4)]">
            SOCIALES
          </span>
        </h1>
        <p class="mt-6 max-w-2xl font-body-md text-on-surface-variant">
          Historias de solidaridad del club: desde útiles escolares hasta apoyo en comunidad.
          Cada rodada también deja huella fuera del asfalto.
        </p>
      </div>
    </section>

    <section class="flex flex-1 flex-col px-gutter-mobile pb-section-gap md:px-gutter-desktop">
      <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <p
          v-if="loading"
          class="flex flex-1 items-center justify-center py-16 text-center text-on-surface-variant"
        >
          Cargando…
        </p>

        <p
          v-else-if="error && items.length === 0"
          class="flex flex-1 items-center justify-center py-16 text-center text-error"
        >
          {{ error }}
        </p>

        <p
          v-else-if="items.length === 0"
          class="flex flex-1 items-center justify-center py-16 text-center text-on-surface-variant"
        >
          Aún no hay publicaciones. Vuelve pronto.
        </p>

        <div
          v-else
          class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <SocialWorkCard
            v-for="item in items"
            :key="item.id"
            :item="item"
          />
        </div>

        <div
          v-if="hasMore"
          class="mt-12 flex justify-center"
        >
          <button
            type="button"
            class="rounded-lg border border-outline-variant/30 px-8 py-3 font-label-sm text-label-sm uppercase tracking-widest text-on-surface transition-all hover:border-primary hover:text-primary disabled:opacity-50"
            :disabled="loadingMore"
            @click="onLoadMore"
          >
            {{ loadingMore ? 'Cargando…' : 'Cargar más' }}
          </button>
        </div>
      </div>
    </section>
  </AppPageShell>
</template>
