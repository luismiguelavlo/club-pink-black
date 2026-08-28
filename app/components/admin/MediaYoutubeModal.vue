<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: []
}>()

const title = ref('')
const youtubeUrl = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    title.value = ''
    youtubeUrl.value = ''
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
        youtubeUrl: youtubeUrl.value,
      },
    })
    emit('created')
    open.value = false
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo agregar el video'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Agregar video de YouTube"
    description="Pega el enlace del video. No se sube el archivo; solo se guarda el link."
  >
    <form
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <FloatingLabelInput
        id="yt-title"
        v-model="title"
        label="Título"
        required
      />
      <FloatingLabelInput
        id="yt-url"
        v-model="youtubeUrl"
        type="url"
        label="URL de YouTube"
        autocomplete="off"
        required
      />

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
        >
          {{ isSubmitting ? 'Guardando…' : 'Agregar' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
