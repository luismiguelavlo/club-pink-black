<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'VISTA COMPLETA',
  },
)

const emit = defineEmits<{
  load: []
}>()
</script>

<template>
  <button
    type="button"
    class="group flex flex-col items-center gap-4"
    @click="emit('load')"
  >
    <span class="font-label-sm text-label-sm text-secondary transition-colors group-hover:text-primary">
      {{ label }}
    </span>
    <div class="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant transition-all group-hover:border-primary group-hover:neon-glow-pink">
      <MaterialIcon
        name="expand_more"
        class="text-secondary transition-all group-hover:translate-y-1 group-hover:text-primary"
      />
    </div>
  </button>
</template>
