<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: []
}>()

const title = ref('')
const videoUrl = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    title.value = ''
    videoUrl.value = ''
    errorMessage.value = ''
  }
})

async function onSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch('/api/admin/media/youtube', {
      method: 'POST',
      body: {
        title: title.value,
        videoUrl: videoUrl.value,
      },
    })
    emit('created')
    open.value = false
  }
  catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo agregar el video'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Agregar video"
    description="Pega un enlace de YouTube o TikTok. No se sube el archivo; solo se guarda el link."
  >
    <form
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <FloatingLabelInput
        id="video-title"
        v-model="title"
        label="Título"
        required
      />
      <FloatingLabelInput
        id="video-url"
        v-model="videoUrl"
        type="url"
        label="URL de YouTube o TikTok"
        autocomplete="off"
        required
      />

      <p class="font-label-sm text-[11px] text-on-surface-variant">
        Ejemplos: youtube.com/watch?v=…, youtu.be/…, tiktok.com/@usuario/video/…, vm.tiktok.com/…
      </p>

      <p
        v-if="errorMessage"
        class="font-label-sm text-label-sm text-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <div class="flex gap-3">
        <AppButton
          type="button"
          variant="ghost"
          class="flex-1"
          @click="open = false"
        >
          Cancelar
        </AppButton>
        <AppButton
          type="submit"
          variant="primary"
          shape="chamfer"
          class="flex-1"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando…' : 'Agregar' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
