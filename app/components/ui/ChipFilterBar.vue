<script setup lang="ts" generic="T extends string">
import type { FilterOption } from '~/types/site'

defineProps<{
  modelValue: T
  filters: FilterOption<T>[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <section class="mb-8 px-gutter-desktop">
    <div class="scrollbar-hide flex items-center gap-4 overflow-x-auto pb-4">
      <FilterChip
        v-for="filter in filters"
        :key="filter.id"
        :label="filter.label"
        :active="modelValue === filter.id"
        @select="emit('update:modelValue', filter.id)"
      />
    </div>
  </section>
</template>
