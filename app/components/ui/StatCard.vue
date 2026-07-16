<script setup lang="ts">
import type { StatItem } from '~/types/site'

defineProps<{
  value: StatItem['value']
  label: StatItem['label']
  align?: StatItem['align']
}>()
</script>

<template>
  <div
    class="glass-panel group flex flex-col rounded-lg p-8 transition-colors duration-300 hover:border-primary/50"
    :class="align === 'right' ? 'items-end text-right' : 'items-start text-left'"
  >
    <span class="font-headline-lg mb-2 text-primary transition-all group-hover:neon-glow">
      {{ value }}
    </span>
    <span class="font-label-sm uppercase tracking-widest text-secondary">
      {{ label }}
    </span>
  </div>
</template>
