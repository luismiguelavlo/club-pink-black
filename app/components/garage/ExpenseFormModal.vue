<script setup lang="ts">
import type { VehicleExpense } from '~/types/garage'
import { EXPENSE_CATEGORY_LABELS } from '~/types/garage'

const props = defineProps<{
  open: boolean
  vehicleId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [expense: VehicleExpense]
}>()

const form = reactive({
  category: 'maintenance' as keyof typeof EXPENSE_CATEGORY_LABELS,
  amount: '' as string | number,
  spentAt: new Date().toISOString().slice(0, 10),
  description: '',
  odometerKm: '' as string | number,
  liters: '' as string | number,
})

const loading = ref(false)
const error = ref('')

const categoryOptions = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

watch(() => props.open, (v) => {
  if (v) {
    Object.assign(form, { category: 'maintenance', amount: '', spentAt: new Date().toISOString().slice(0, 10), description: '', odometerKm: '', liters: '' })
    error.value = ''
  }
})

async function save() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ expense: VehicleExpense }>(`/api/garage/vehicles/${props.vehicleId}/expenses`, {
      method: 'POST',
      body: {
        category: form.category,
        amount: Number(form.amount),
        spentAt: form.spentAt,
        description: form.description,
        odometerKm: form.odometerKm !== '' ? Number(form.odometerKm) : undefined,
        liters: form.liters !== '' ? Number(form.liters) : undefined,
      },
    })
    emit('saved', res.expense)
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
    title="Registrar gasto"
    @update:open="$emit('update:open', $event)"
  >
    <form
      class="space-y-4"
      @submit.prevent="save"
    >
      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Categoría *</label>
        <select
          v-model="form.category"
          class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
        >
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Monto COP *</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            required
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Fecha *</label>
          <input
            v-model="form.spentAt"
            type="date"
            required
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <FloatingLabelInput
        id="exp-description"
        v-model="form.description"
        label="Descripción *"
        required
      />

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Odómetro (km)</label>
          <input
            v-model.number="form.odometerKm"
            type="number"
            min="0"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div v-if="form.category === 'fuel'">
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Litros</label>
          <input
            v-model.number="form.liters"
            type="number"
            min="0"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <p v-if="error" class="text-sm text-error">{{ error }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <AppButton variant="outline" @click="$emit('update:open', false)">Cancelar</AppButton>
        <AppButton type="submit" :disabled="loading">{{ loading ? 'Guardando...' : 'Registrar' }}</AppButton>
      </div>
    </form>
  </AdminModal>
</template>
