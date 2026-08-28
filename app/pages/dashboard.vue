<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

await navigateTo('/games')
</script>

<template>
  <div />
</template>
