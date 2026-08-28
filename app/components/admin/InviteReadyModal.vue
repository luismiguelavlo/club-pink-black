<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  invite: {
    code: string
    email: string | null
    role: 'admin' | 'user'
    expiresAt: string
    inviteUrl: string
  } | null
}>()

const copied = ref<'code' | 'url' | null>(null)

const expiresLabel = computed(() => {
  if (!props.invite) return ''
  return new Date(props.invite.expiresAt).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})

async function copy(value: string, kind: 'code' | 'url') {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = kind
    window.setTimeout(() => {
      if (copied.value === kind) copied.value = null
    }, 1800)
  } catch {
    copied.value = null
  }
}
</script>

<template>
  <AdminModal
    v-model:open="open"
    title="Invitación lista"
    description="Comparte el enlace o el código. Expira en 24 horas."
  >
    <div
      v-if="invite"
      class="space-y-6"
    >
      <div class="rounded-lg border border-primary/30 bg-black/40 p-4">
        <p class="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant">
          Código
        </p>
        <div class="mt-2 flex items-center justify-between gap-3">
          <code class="font-label-sm text-lg text-primary">
            {{ invite.code }}
          </code>
          <button
            type="button"
            class="text-on-surface-variant transition-colors hover:text-primary"
            :aria-label="copied === 'code' ? 'Copiado' : 'Copiar código'"
            @click="copy(invite.code, 'code')"
          >
            <MaterialIcon :name="copied === 'code' ? 'check' : 'content_copy'" />
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-outline-variant/30 bg-surface-container p-4">
        <p class="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant">
          Enlace
        </p>
        <div class="mt-2 flex items-start justify-between gap-3">
          <p class="break-all font-label-sm text-sm text-on-surface">
            {{ invite.inviteUrl }}
          </p>
          <button
            type="button"
            class="shrink-0 text-on-surface-variant transition-colors hover:text-primary"
            :aria-label="copied === 'url' ? 'Copiado' : 'Copiar enlace'"
            @click="copy(invite.inviteUrl, 'url')"
          >
            <MaterialIcon :name="copied === 'url' ? 'check' : 'content_copy'" />
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
        <span>
          Rol:
          <span class="text-primary">{{ invite.role === 'admin' ? 'administrador' : 'usuario' }}</span>
        </span>
        <span v-if="invite.email">
          Email:
          <span class="text-primary">{{ invite.email }}</span>
        </span>
        <span>
          Expira:
          <span class="text-primary">{{ expiresLabel }}</span>
        </span>
      </div>

      <AppButton
        type="button"
        variant="primary"
        shape="chamfer"
        block
        @click="open = false"
      >
        Listo
      </AppButton>
    </div>
  </AdminModal>
</template>
