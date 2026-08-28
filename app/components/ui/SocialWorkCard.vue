<script setup lang="ts">
import type { SocialWorkPreview } from '~/types/site'

defineProps<{
  item: SocialWorkPreview
}>()

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function excerpt(text: string, max = 140) {
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}
</script>

<template>
  <NuxtLink
    :to="`/labores-sociales/${item.id}`"
    class="group flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-lg transition-all hover:border-primary/30 hover:shadow-[0_0_30px_rgba(255,71,156,0.15)]"
  >
    <div class="relative aspect-[16/10] overflow-hidden bg-surface-container-highest">
      <div
        v-if="item.coverImageUrl"
        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        :style="{ backgroundImage: `url('${item.coverImageUrl}')` }"
        role="img"
        :aria-label="item.title"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-surface-container-high"
      >
        <MaterialIcon
          name="volunteer_activism"
          class="text-5xl text-primary/40"
        />
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <span
          v-if="item.publishedAt"
          class="rounded-full bg-surface-container-highest/90 px-3 py-1 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant backdrop-blur-sm"
        >
          {{ formatDate(item.publishedAt) }}
        </span>
        <div class="flex gap-2">
          <span
            v-if="item.imageCount"
            class="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 font-label-sm text-[10px] text-on-primary"
          >
            <MaterialIcon
              name="photo_camera"
              class="text-xs"
            />
            {{ item.imageCount }}
          </span>
          <span
            v-if="item.videoCount"
            class="flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 font-label-sm text-[10px] text-on-primary"
          >
            <MaterialIcon
              name="play_circle"
              class="text-xs"
            />
            {{ item.videoCount }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <h3 class="mb-2 font-headline-lg text-lg text-on-surface transition-colors group-hover:text-primary">
        {{ item.title }}
      </h3>
      <p class="mb-4 flex-1 font-body-md text-sm leading-relaxed text-on-surface-variant">
        {{ excerpt(item.description) }}
      </p>
      <span class="font-label-sm text-label-sm uppercase tracking-widest text-primary">
        Leer más
        <MaterialIcon
          name="arrow_forward"
          class="ml-1 inline text-sm transition-transform group-hover:translate-x-1"
        />
      </span>
    </div>
  </NuxtLink>
</template>
