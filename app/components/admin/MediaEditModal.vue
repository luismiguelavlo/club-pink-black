<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  item: {
    id: string
    title: string
    kind: 'photo' | 'video'
  } | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const title = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(
  () => [open.value, props.item] as const,
  ([isOpen, item]) => {
    if (isOpen && item) {
      title.value = item.title
      errorMessage.value = ''
    }
  },
)

async function onSubmit() {
  if (!props.item) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await $fetch(`/api/admin/media/${props.item.id}`, {
      method: 'PATCH',
      body: { title: title.value },
    })
    emit('saved')
    open.value = false
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo actualizar'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Editar contenido"
    :description="item ? `Tipo: ${item.kind === 'photo' ? 'foto' : 'video'}` : undefined"
  >
    <form
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <FloatingLabelInput
        id="media-edit-title"
        v-model="title"
        label="Título"
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
          {{ isSubmitting ? 'Guardando…' : 'Guardar' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
