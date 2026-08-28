<script setup lang="ts">
import type { MaintenanceReminder } from '~/types/garage'
import { MAINTENANCE_TYPE_LABELS } from '~/types/garage'

const props = defineProps<{
  open: boolean
  vehicleId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [reminder: MaintenanceReminder]
}>()

const form = reactive({
  type: 'oil_change' as string,
  title: '',
  intervalKm: '' as string | number,
  intervalMonths: '' as string | number,
  notes: '',
})

const loading = ref(false)
const error = ref('')
const typeOptions = Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))

watch(() => props.open, (v) => {
  if (v) {
    Object.assign(form, { type: 'oil_change', title: '', intervalKm: '', intervalMonths: '', notes: '' })
    error.value = ''
  }
})

watch(() => form.type, (t) => {
  if (!form.title) form.title = MAINTENANCE_TYPE_LABELS[t as keyof typeof MAINTENANCE_TYPE_LABELS] ?? ''
})

async function save() {
  if (!form.intervalKm && !form.intervalMonths) {
    error.value = 'Indica al menos un intervalo (km o meses)'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ reminder: MaintenanceReminder }>(`/api/garage/vehicles/${props.vehicleId}/reminders`, {
      method: 'POST',
      body: {
        type: form.type,
        title: form.title,
        intervalKm: form.intervalKm !== '' ? Number(form.intervalKm) : undefined,
        intervalMonths: form.intervalMonths !== '' ? Number(form.intervalMonths) : undefined,
        notes: form.notes || undefined,
      },
    })
    emit('saved', res.reminder)
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
    title="Agregar recordatorio"
    @update:open="$emit('update:open', $event)"
  >
    <form class="space-y-4" @submit.prevent="save">
      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Tipo *</label>
        <select
          v-model="form.type"
          class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <FloatingLabelInput id="r-title" v-model="form.title" label="Nombre del recordatorio *" required />

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Cada (km)</label>
          <input
            v-model.number="form.intervalKm"
            type="number"
            min="1"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Cada (meses)</label>
          <input
            v-model.number="form.intervalMonths"
            type="number"
            min="1"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>
      <p class="text-xs text-on-surface-variant">Indica km, meses, o ambos.</p>

      <p v-if="error" class="text-sm text-error">{{ error }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <AppButton variant="outline" @click="$emit('update:open', false)">Cancelar</AppButton>
        <AppButton type="submit" :disabled="loading">{{ loading ? 'Guardando...' : 'Agregar' }}</AppButton>
      </div>
    </form>
  </AdminModal>
</template>
