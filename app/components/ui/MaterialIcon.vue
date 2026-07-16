<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    filled?: boolean
  }>(),
  {
    filled: false,
  },
)
</script>

<template>
  <span
    class="material-symbols-outlined"
    :class="{ fill: filled }"
    aria-hidden="true"
  >
    {{ name }}
  </span>
</template>
