<script setup lang="ts">
import type { GalleryItem } from '~/types/site'

const props = withDefaults(
  defineProps<{
    title?: string
    viewAllLabel?: string
    viewAllHref?: string
    items?: GalleryItem[]
  }>(),
  {
    title: 'Nuestra Huella',
    viewAllLabel: 'Ver Todo',
    viewAllHref: '/gallery',
    items: undefined,
  },
)

const { data, pending, error } = await useAsyncData(
  'public-gallery-preview',
  () => $fetch<{ items: GalleryItem[] }>('/api/public/gallery', { query: { limit: 4 } }),
  {
    immediate: props.items === undefined,
  },
)

const resolvedItems = computed(() => props.items ?? data.value?.items ?? [])
</script>

<template>
  <section
    id="gallery"
    class="relative bg-surface-container-low px-gutter-mobile py-section-gap md:px-gutter-desktop"
  >
    <div class="mx-auto max-w-7xl">
      <div class="mb-12 flex items-end justify-between border-b border-outline-variant pb-4">
        <h2 class="font-headline-lg text-on-surface">
          {{ title }}
        </h2>
        <NuxtLink
          :to="viewAllHref"
          class="font-label-sm flex items-center gap-2 text-primary transition-all hover:neon-glow"
        >
          {{ viewAllLabel }}
          <MaterialIcon
            name="arrow_forward"
            class="text-sm"
          />
        </NuxtLink>
      </div>

      <p
        v-if="pending && resolvedItems.length === 0"
        class="font-body-md py-12 text-center text-secondary"
      >
        Cargando archivo visual…
      </p>

      <p
        v-else-if="error"
        class="font-body-md py-12 text-center text-secondary"
      >
        No se pudo cargar la galería.
      </p>

      <p
        v-else-if="resolvedItems.length === 0"
        class="font-body-md py-12 text-center text-secondary"
      >
        Pronto subiremos las primeras capturas del club.
      </p>

      <div
        v-else
        class="grid auto-rows-[250px] grid-cols-1 gap-4 md:grid-cols-12"
      >
        <GalleryCard
          v-for="item in resolvedItems"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
  </section>
</template>
