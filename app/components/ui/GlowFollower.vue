<script setup lang="ts">
const follower = ref<HTMLElement | null>(null)
const isVisible = ref(false)

function onMouseMove(event: MouseEvent) {
  if (!follower.value) {
    return
  }

  isVisible.value = true
  follower.value.style.left = `${event.clientX - 128}px`
  follower.value.style.top = `${event.clientY - 128}px`
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div
    ref="follower"
    class="pointer-events-none fixed -z-10 h-64 w-64 rounded-full bg-primary/5 blur-[80px] transition-opacity duration-500"
    :class="isVisible ? 'opacity-100' : 'opacity-0'"
    aria-hidden="true"
  />
</template>
