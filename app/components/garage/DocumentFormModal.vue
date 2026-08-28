<script setup lang="ts">
import type { VehicleDocument } from '~/types/garage'
import { DOCUMENT_KIND_LABELS } from '~/types/garage'

const props = defineProps<{
  open: boolean
  vehicleId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [document: VehicleDocument]
}>()

const form = reactive({
  kind: 'soat' as string,
  number: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
})

const loading = ref(false)
const error = ref('')
const kindOptions = Object.entries(DOCUMENT_KIND_LABELS).map(([value, label]) => ({ value, label }))

watch(() => props.open, (v) => {
  if (v) {
    Object.assign(form, { kind: 'soat', number: '', issuedAt: '', expiresAt: '', notes: '' })
    error.value = ''
  }
})

async function save() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ document: VehicleDocument }>(`/api/garage/vehicles/${props.vehicleId}/documents`, {
      method: 'POST',
      body: {
        kind: form.kind,
        number: form.number || undefined,
        issuedAt: form.issuedAt || undefined,
        expiresAt: form.expiresAt,
        notes: form.notes || undefined,
      },
    })
    emit('saved', res.document)
    emit('update:open', false)
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = e.data?.statusMessage ?? e.statusMessage ?? 'Error al guardar'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AdminModal
    :open="open"
    title="Agregar documento"
    @update:open="$emit('update:open', $event)"
  >
    <form class="space-y-4" @submit.prevent="save">
      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Tipo *</label>
        <select
          v-model="form.kind"
          class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
          <option v-for="opt in kindOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <FloatingLabelInput id="doc-number" v-model="form.number" label="Número (SOAT, póliza, etc.)" />

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Fecha de expedición</label>
          <input
            v-model="form.issuedAt"
            type="date"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Vencimiento *</label>
          <input
            v-model="form.expiresAt"
            type="date"
            required
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Notas</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        />
      </div>

      <p v-if="error" class="text-sm text-error">{{ error }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <AppButton variant="outline" @click="$emit('update:open', false)">Cancelar</AppButton>
        <AppButton type="submit" :disabled="loading">{{ loading ? 'Guardando...' : 'Agregar' }}</AppButton>
      </div>
    </form>
  </AdminModal>
</template>
