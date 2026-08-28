<script setup lang="ts">
const route = useRoute()

await navigateTo({
  path: '/rodadas',
  query: route.query,
  replace: true,
})
</script>

<template>
  <div />
</template>
