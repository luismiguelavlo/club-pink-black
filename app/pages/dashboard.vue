<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

await navigateTo('/feed')
</script>

<template>
  <div />
</template>
