<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  eventId: string | null
  eventTitle?: string
}>()

const emit = defineEmits<{
  success: []
}>()

const form = reactive({
  name: '',
  email: '',
  machine: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = ''
  success.value = ''
  form.name = ''
  form.email = ''
  form.machine = ''
})

async function onSubmit() {
  if (!props.eventId || loading.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await $fetch<{ message: string }>(
      `/api/public/rodadas/${props.eventId}/rsvp`,
      {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          machine: form.machine,
        },
      },
    )

    success.value = result.message
    emit('success')

    window.setTimeout(() => {
      open.value = false
    }, 1200)
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value =
      fetchError.data?.statusMessage
      ?? fetchError.statusMessage
      ?? 'No se pudo guardar la reserva'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Reservar lugar"
    :description="eventTitle ? `Confirma tu asistencia a “${eventTitle}”.` : 'Confirma tu asistencia a la rodada.'"
  >
    <form
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <FloatingLabelInput
        id="rsvp-name"
        v-model="form.name"
        label="NOMBRE"
        autocomplete="name"
        required
      />
      <FloatingLabelInput
        id="rsvp-email"
        v-model="form.email"
        type="email"
        label="EMAIL"
        autocomplete="email"
        required
      />
      <FloatingLabelInput
        id="rsvp-machine"
        v-model="form.machine"
        label="TU MÁQUINA (OPCIONAL)"
      />

      <p
        v-if="error"
        class="font-body-md text-sm text-error"
      >
        {{ error }}
      </p>
      <p
        v-if="success"
        class="font-body-md text-sm text-primary"
      >
        {{ success }}
      </p>

      <AppButton
        type="submit"
        block
        :disabled="loading || Boolean(success)"
      >
        {{ loading ? 'Guardando…' : 'Confirmar reserva' }}
      </AppButton>
    </form>
  </AdminModal>
</template>
