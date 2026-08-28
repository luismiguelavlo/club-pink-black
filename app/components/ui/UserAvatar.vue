<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    avatarUrl?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    ring?: boolean
  }>(),
  {
    avatarUrl: null,
    size: 'md',
    ring: false,
  },
)

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-28 w-28 text-3xl',
}
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest font-label-sm font-bold text-primary"
    :class="[
      sizeClasses[size],
      ring ? 'border-2 border-primary/40 shadow-[0_0_20px_rgba(255,71,156,0.35)]' : 'border border-primary/20',
    ]"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      :alt="name"
      class="h-full w-full object-cover"
    >
    <span v-else>
      {{ name.charAt(0).toUpperCase() }}
    </span>
  </div>
</template>
