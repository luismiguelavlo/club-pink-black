<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    active?: boolean
  }>(),
  {
    active: false,
  },
)

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="font-label-sm shrink-0 px-8 py-2 text-label-sm uppercase tracking-widest transition-all"
    :class="
      props.active
        ? 'rounded-full bg-primary text-on-primary hover:scale-105'
        : 'rounded-full border border-outline-variant text-on-surface hover:border-primary hover:text-primary'
    "
    :aria-pressed="props.active"
    @click="emit('select')"
  >
    {{ label }}
  </button>
</template>
