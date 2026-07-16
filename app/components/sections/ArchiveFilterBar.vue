<script setup lang="ts">
import type { GalleryFilter } from '~/types/site'
import { archiveFilters } from '~/data/site'

withDefaults(
  defineProps<{
    modelValue?: GalleryFilter
    filters?: { id: GalleryFilter; label: string }[]
  }>(),
  {
    modelValue: 'all',
    filters: () => archiveFilters,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: GalleryFilter]
}>()
</script>

<template>
  <ChipFilterBar
    :model-value="modelValue"
    :filters="filters"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
