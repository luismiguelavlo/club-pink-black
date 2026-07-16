<script setup lang="ts">
import type { GalleryItem } from '~/types/site'

defineProps<{
  item: GalleryItem
}>()
</script>

<template>
  <article
    class="glass-panel group relative overflow-hidden rounded-lg"
    :class="item.span === 'wide' ? 'md:col-span-8' : 'md:col-span-4'"
  >
    <div
      class="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-700 group-hover:scale-105"
      :style="{ backgroundImage: `url('${item.imageUrl}')` }"
      role="img"
      :aria-label="item.imageAlt"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
    <div class="absolute bottom-6 left-6 right-6">
      <span
        v-if="item.badge"
        class="mb-3 inline-block rounded-full bg-primary px-3 py-1 font-label-sm text-[10px] text-on-primary"
      >
        {{ item.badge }}
      </span>
      <h3
        class="font-headline-lg-mobile text-on-surface"
        :class="item.subtitle ? 'mb-1 text-xl' : 'mb-2'"
      >
        {{ item.title }}
      </h3>
      <p
        v-if="item.subtitle"
        class="font-label-sm text-secondary"
      >
        {{ item.subtitle }}
      </p>
    </div>
  </article>
</template>
