<script setup lang="ts">
definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const { user } = useUserSession()

await navigateTo(`/profile/${user.value?.id}`, { replace: true })
</script>

<template>
  <div />
</template>
