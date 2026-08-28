<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: undefined,
  },
)

const emit = defineEmits<{
  close: []
}>()

function onClose() {
  open.value = false
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') onClose()
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center p-gutter-mobile"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
      @keydown="onKeydown"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Cerrar"
        @click="onClose"
      />

      <div
        class="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-surface-container-low shadow-[0_0_40px_rgba(255,176,202,0.12)]"
      >
        <div class="flex items-start justify-between border-b border-outline-variant/10 p-6">
          <div>
            <h2 class="font-headline-lg text-xl text-on-surface">
              {{ props.title }}
            </h2>
            <p
              v-if="props.description"
              class="mt-2 text-sm text-on-surface-variant"
            >
              {{ props.description }}
            </p>
          </div>
          <button
            type="button"
            class="text-on-surface-variant transition-colors hover:text-primary"
            aria-label="Cerrar modal"
            @click="onClose"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
