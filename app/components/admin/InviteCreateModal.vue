<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  created: [invite: {
    id: string
    code: string
    email: string | null
    role: 'admin' | 'user'
    expiresAt: string
    inviteUrl: string
  }]
}>()

const email = ref('')
const role = ref<'admin' | 'user'>('user')
const errorMessage = ref('')
const isSubmitting = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    email.value = ''
    role.value = 'user'
    errorMessage.value = ''
  }
})

async function onSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await $fetch<{
      invite: {
        id: string
        code: string
        email: string | null
        role: 'admin' | 'user'
        expiresAt: string
        inviteUrl: string
      }
    }>('/api/admin/invites', {
      method: 'POST',
      body: {
        email: email.value,
        role: role.value,
      },
    })

    emit('created', response.invite)
    open.value = false
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    errorMessage.value =
      err.data?.statusMessage
      ?? err.statusMessage
      ?? err.message
      ?? 'No se pudo generar la invitación. Reinicia el servidor de desarrollo si el error persiste.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Generar invitación"
    description="Crea un código de acceso con validez de 24 horas. El email es opcional; si lo defines, solo ese correo podrá registrarse."
  >
    <form
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <FloatingLabelInput
        id="invite-email"
        v-model="email"
        type="email"
        label="Email del piloto (opcional)"
        autocomplete="off"
      />

      <div>
        <label
          for="invite-role"
          class="mb-2 block font-label-sm text-label-sm text-secondary"
        >
          Rol
        </label>
        <select
          id="invite-role"
          v-model="role"
          class="w-full border-0 border-b border-outline-variant bg-transparent py-3 font-body-md text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="user">
            Usuario
          </option>
          <option value="admin">
            Administrador
          </option>
        </select>
      </div>

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
          {{ isSubmitting ? 'Generando…' : 'Generar' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
