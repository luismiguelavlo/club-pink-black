<script setup lang="ts">
import type { SocialWorkPreview } from '~/types/site'

const props = withDefaults(
  defineProps<{
    title?: string
    viewAllLabel?: string
    viewAllHref?: string
    items?: SocialWorkPreview[]
  }>(),
  {
    title: 'Labores Sociales',
    viewAllLabel: 'Ver todas',
    viewAllHref: '/labores-sociales',
    items: undefined,
  },
)

const { data, pending, error } = await useAsyncData(
  'public-social-work-preview',
  () => $fetch<{ items: SocialWorkPreview[] }>('/api/public/labores-sociales', { query: { limit: 3 } }),
  {
    immediate: props.items === undefined,
  },
)

const resolvedItems = computed(() => props.items ?? data.value?.items ?? [])
</script>

<template>
  <section
    id="labores-sociales"
    class="relative bg-background px-gutter-mobile py-section-gap md:px-gutter-desktop"
  >
    <div class="mx-auto max-w-7xl">
      <div class="mb-12 flex flex-col gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span class="mb-2 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            Más allá del asfalto
          </span>
          <h2 class="font-headline-lg text-on-surface">
            {{ title }}
          </h2>
          <p class="mt-3 max-w-2xl font-body-md text-on-surface-variant">
            Acciones de impacto comunitario del club: donaciones, apoyo escolar y presencia en la calle con propósito.
          </p>
        </div>
        <NuxtLink
          :to="viewAllHref"
          class="font-label-sm flex shrink-0 items-center gap-2 text-primary transition-all hover:neon-glow"
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
        Cargando labores sociales…
      </p>

      <p
        v-else-if="error"
        class="font-body-md py-12 text-center text-secondary"
      >
        No se pudieron cargar las labores sociales.
      </p>

      <p
        v-else-if="resolvedItems.length === 0"
        class="font-body-md py-12 text-center text-secondary"
      >
        Pronto compartiremos las primeras acciones sociales del club.
      </p>

      <div
        v-else
        class="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        <SocialWorkCard
          v-for="item in resolvedItems"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
  </section>
</template>
