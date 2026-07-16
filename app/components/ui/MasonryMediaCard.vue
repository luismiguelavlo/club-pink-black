<script setup lang="ts">
import type { ArchiveMediaItem } from '~/types/site'

const props = defineProps<{
  item: ArchiveMediaItem
}>()

const sizeClass = computed(() => {
  switch (props.item.size) {
    case 'large':
      return 'masonry-item-large'
    case 'tall':
      return 'masonry-item-tall'
    default:
      return ''
  }
})

const isFeatured = computed(
  () => Boolean(props.item.badge && props.item.title),
)

const isTallVideo = computed(
  () => props.item.kind === 'video' && props.item.size === 'tall',
)

const isCompactVideo = computed(
  () => props.item.kind === 'video' && props.item.size === 'standard',
)

const isHoverPhoto = computed(
  () =>
    props.item.kind === 'photo'
    && props.item.size === 'standard'
    && !props.item.caption
    && !isFeatured.value,
)
</script>

<template>
  <article
    class="chamfer-clip group relative overflow-hidden"
    :class="[
      sizeClass,
      isFeatured ? 'bg-surface-container-high' : '',
      isTallVideo ? 'border-l border-t border-white/10 bg-surface-container-high' : '',
      isCompactVideo || (item.kind === 'photo' && item.size === 'standard' && !isFeatured)
        ? 'border border-outline-variant/30'
        : '',
      isCompactVideo ? 'bg-surface-container-low' : '',
    ]"
  >
    <!-- Featured uses <img>; others use background cover -->
    <img
      v-if="isFeatured"
      :src="item.imageUrl"
      :alt="item.imageAlt"
      class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      loading="lazy"
    >
    <div
      v-else
      class="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
      :style="{ backgroundImage: `url('${item.imageUrl}')` }"
      role="img"
      :aria-label="item.imageAlt"
    />

    <!-- Featured overlay -->
    <template v-if="isFeatured">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      <div class="absolute bottom-6 left-6">
        <span
          v-if="item.badge"
          class="font-label-sm mb-2 inline-block bg-primary px-3 py-1 text-[10px] uppercase text-on-primary"
        >
          {{ item.badge }}
        </span>
        <h3 class="font-headline-lg text-headline-lg text-white">
          {{ item.title }}
        </h3>
      </div>
    </template>

    <!-- Tall video overlay -->
    <template v-else-if="isTallVideo">
      <div class="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/10">
        <div class="glass-panel flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 transition-transform group-hover:scale-110">
          <MaterialIcon
            name="play_arrow"
            filled
            class="text-4xl text-primary"
          />
        </div>
      </div>
      <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <span
          v-if="item.duration"
          class="font-label-sm bg-black/60 px-2 py-1 text-[10px] text-white"
        >
          {{ item.duration }}
        </span>
        <p
          v-if="item.videoLabel"
          class="font-label-sm text-right text-[10px] text-primary"
        >
          {{ item.videoLabel }}
        </p>
      </div>
    </template>

    <!-- Compact video overlay -->
    <template v-else-if="isCompactVideo">
      <div class="absolute right-2 top-2">
        <MaterialIcon
          name="videocam"
          class="text-primary drop-shadow-lg"
        />
      </div>
      <div class="absolute inset-0 flex items-center justify-center">
        <MaterialIcon
          name="play_circle"
          class="text-3xl text-white/80"
        />
      </div>
    </template>

    <!-- Caption photo -->
    <div
      v-else-if="item.caption"
      class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-4"
    >
      <p class="font-label-sm text-[10px] uppercase text-secondary">
        {{ item.caption }}
      </p>
    </div>

    <!-- Hover fullscreen photo -->
    <div
      v-else-if="isHoverPhoto"
      class="absolute inset-0 flex items-end bg-primary/20 p-4 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <MaterialIcon
        name="fullscreen"
        class="text-white"
      />
    </div>
  </article>
</template>
