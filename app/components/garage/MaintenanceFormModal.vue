<script setup lang="ts">
import type { MaintenanceRecord } from '~/types/garage'
import { MAINTENANCE_TYPE_LABELS } from '~/types/garage'

const props = defineProps<{
  open: boolean
  vehicleId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [record: MaintenanceRecord]
}>()

const form = reactive({
  type: 'oil_change' as keyof typeof MAINTENANCE_TYPE_LABELS,
  title: '',
  performedAt: new Date().toISOString().slice(0, 10),
  odometerKm: '' as string | number,
  workshop: '',
  cost: '' as string | number,
  parts: '',
  notes: '',
})

const loading = ref(false)
const error = ref('')

const typeOptions = Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))

watch(() => props.open, (v) => {
  if (v) {
    Object.assign(form, {
      type: 'oil_change',
      title: '',
      performedAt: new Date().toISOString().slice(0, 10),
      odometerKm: '',
      workshop: '',
      cost: '',
      parts: '',
      notes: '',
    })
    error.value = ''
  }
})

watch(() => form.type, (t) => {
  if (!form.title) form.title = MAINTENANCE_TYPE_LABELS[t as keyof typeof MAINTENANCE_TYPE_LABELS] ?? ''
})

async function save() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ record: MaintenanceRecord }>(`/api/garage/vehicles/${props.vehicleId}/maintenance`, {
      method: 'POST',
      body: {
        type: form.type,
        title: form.title,
        performedAt: form.performedAt,
        odometerKm: form.odometerKm !== '' ? Number(form.odometerKm) : undefined,
        workshop: form.workshop || undefined,
        cost: form.cost !== '' ? Number(form.cost) : undefined,
        parts: form.parts || undefined,
        notes: form.notes || undefined,
      },
    })
    emit('saved', res.record)
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
    title="Registrar mantenimiento"
    @update:open="$emit('update:open', $event)"
  >
    <form
      class="space-y-4"
      @submit.prevent="save"
    >
      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Tipo *</label>
        <select
          v-model="form.type"
          class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
          <option
            v-for="opt in typeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <FloatingLabelInput
        id="m-title"
        v-model="form.title"
        label="Descripción *"
        required
      />

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Fecha *</label>
          <input
            v-model="form.performedAt"
            type="date"
            required
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Odómetro (km)</label>
          <input
            v-model.number="form.odometerKm"
            type="number"
            min="0"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <FloatingLabelInput
          id="m-workshop"
          v-model="form.workshop"
          label="Taller"
        />
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Costo (COP)</label>
          <input
            v-model.number="form.cost"
            type="number"
            min="0"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <FloatingLabelInput
        id="m-parts"
        v-model="form.parts"
        label="Repuestos utilizados"
      />

      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Notas</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        />
      </div>

      <p
        v-if="error"
        class="text-sm text-error"
      >
        {{ error }}
      </p>

      <div class="flex justify-end gap-3 pt-2">
        <AppButton variant="outline" @click="$emit('update:open', false)">
          Cancelar
        </AppButton>
        <AppButton type="submit" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Registrar' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
