<script setup lang="ts">
import type { ArchiveMediaItem, GalleryFilter } from '~/types/site'
import { archiveMediaItems } from '~/data/site'

const props = withDefaults(
  defineProps<{
    items?: ArchiveMediaItem[]
    filter?: GalleryFilter
  }>(),
  {
    items: () => archiveMediaItems,
    filter: 'all',
  },
)

const emit = defineEmits<{
  loadMore: []
}>()

const visibleItems = computed(() => {
  if (props.filter === 'all') {
    return props.items
  }

  return props.items.filter((item) => item.kind === props.filter)
})
</script>

<template>
  <section class="mb-section-gap px-gutter-desktop">
    <div class="masonry-grid gap-4">
      <MasonryMediaCard
        v-for="item in visibleItems"
        :key="item.id"
        :item="item"
      />
    </div>

    <div class="mt-16 flex justify-center">
      <LoadMoreButton @load="emit('loadMore')" />
    </div>
  </section>
</template>
