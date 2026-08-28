<script setup lang="ts">
import type { Vehicle } from '~/types/garage'

const props = defineProps<{
  open: boolean
  vehicle?: Vehicle | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [vehicle: Vehicle]
}>()

const isEdit = computed(() => !!props.vehicle)
const currentYear = new Date().getFullYear()

const form = reactive({
  brand: '',
  model: '',
  year: currentYear,
  engineCc: '' as string | number,
  plate: '',
  color: '',
  odometerKm: 0,
  purchaseDate: '',
  notes: '',
})

const loading = ref(false)
const error = ref('')

watch(() => props.open, (v) => {
  if (v) {
    if (props.vehicle) {
      form.brand = props.vehicle.brand
      form.model = props.vehicle.model
      form.year = props.vehicle.year
      form.engineCc = props.vehicle.engineCc ?? ''
      form.plate = props.vehicle.plate ?? ''
      form.color = props.vehicle.color ?? ''
      form.odometerKm = props.vehicle.odometerKm
      form.purchaseDate = props.vehicle.purchaseDate ? props.vehicle.purchaseDate.slice(0, 10) : ''
      form.notes = props.vehicle.notes ?? ''
    }
    else {
      Object.assign(form, { brand: '', model: '', year: currentYear, engineCc: '', plate: '', color: '', odometerKm: 0, purchaseDate: '', notes: '' })
    }
    error.value = ''
  }
})

async function save() {
  loading.value = true
  error.value = ''
  try {
    const body = {
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      engineCc: form.engineCc !== '' ? Number(form.engineCc) : undefined,
      plate: form.plate || undefined,
      color: form.color || undefined,
      odometerKm: Number(form.odometerKm),
      purchaseDate: form.purchaseDate || undefined,
      notes: form.notes || undefined,
    }

    let vehicle: Vehicle
    if (isEdit.value && props.vehicle) {
      const res = await $fetch<{ vehicle: Vehicle }>(`/api/garage/vehicles/${props.vehicle.id}`, {
        method: 'PATCH',
        body,
      })
      vehicle = res.vehicle
    }
    else {
      const res = await $fetch<{ vehicle: Vehicle }>('/api/garage/vehicles', {
        method: 'POST',
        body,
      })
      vehicle = res.vehicle
    }

    emit('saved', vehicle)
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
    :title="isEdit ? 'Editar moto' : 'Agregar moto'"
    @update:open="$emit('update:open', $event)"
  >
    <form
      class="space-y-4"
      @submit.prevent="save"
    >
      <div class="grid grid-cols-2 gap-4">
        <FloatingLabelInput
          id="brand"
          v-model="form.brand"
          label="Marca *"
          required
        />
        <FloatingLabelInput
          id="model"
          v-model="form.model"
          label="Modelo *"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Año *</label>
          <input
            v-model.number="form.year"
            type="number"
            :min="1950"
            :max="currentYear + 1"
            required
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Cilindrada (cc)</label>
          <input
            v-model.number="form.engineCc"
            type="number"
            min="50"
            max="3000"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <FloatingLabelInput
          id="plate"
          v-model="form.plate"
          label="Placa"
        />
        <FloatingLabelInput
          id="color"
          v-model="form.color"
          label="Color"
        />
      </div>

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
        <div>
          <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Fecha de compra</label>
          <input
            v-model="form.purchaseDate"
            type="date"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
          >
        </div>
      </div>

      <div>
        <label class="mb-1 block font-label-sm text-label-sm uppercase text-on-surface-variant">Notas</label>
        <textarea
          v-model="form.notes"
          rows="3"
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
        <AppButton
          variant="outline"
          @click="$emit('update:open', false)"
        >
          Cancelar
        </AppButton>
        <AppButton
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar moto' }}
        </AppButton>
      </div>
    </form>
  </AdminModal>
</template>
