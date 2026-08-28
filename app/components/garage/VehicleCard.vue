<script setup lang="ts">
import type { Vehicle, GarageAlert } from '~/types/garage'
import { VEHICLE_STATUS_LABELS } from '~/types/garage'
import { formatKm } from '~/utils/format'

const props = defineProps<{
  vehicle: Vehicle
  alerts?: GarageAlert[]
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  setPrimary: [id: string]
}>()

const vehicleAlerts = computed(() =>
  (props.alerts ?? []).filter((a) => a.vehicleId === props.vehicle.id),
)

const hasUrgent = computed(() =>
  vehicleAlerts.value.some((a) => a.status === 'overdue' || a.status === 'expired'),
)

const statusColor: Record<string, string> = {
  active: 'text-on-surface',
  sold: 'text-on-surface-variant',
  inactive: 'text-on-surface-variant',
}
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,176,202,0.15)]"
    :class="hasUrgent ? 'border-error/40 bg-error/5' : 'border-outline-variant/20 bg-surface-container-low/30'"
    @click="emit('select', vehicle.id)"
  >
    <div class="relative aspect-video w-full overflow-hidden bg-surface-container-highest">
      <img
        v-if="vehicle.imageUrl"
        :src="vehicle.imageUrl"
        :alt="`${vehicle.brand} ${vehicle.model}`"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
      >
        <MaterialIcon
          name="two_wheeler"
          class="text-6xl text-outline-variant"
        />
      </div>

      <div
        v-if="vehicle.isPrimary"
        class="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 font-label-sm text-label-sm uppercase text-on-primary"
      >
        Principal
      </div>

      <div
        v-if="hasUrgent"
        class="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm text-on-error"
      >
        <MaterialIcon name="warning" class="text-sm" />
        Alerta
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h3 class="font-headline-lg text-xl text-on-surface">
          {{ vehicle.brand }} {{ vehicle.model }}
        </h3>
        <div class="mt-1 flex items-center gap-2">
          <span class="font-label-sm text-label-sm uppercase text-primary">{{ vehicle.year }}</span>
          <span
            v-if="vehicle.engineCc"
            class="font-label-sm text-label-sm uppercase text-on-surface-variant"
          >
            · {{ vehicle.engineCc }} cc
          </span>
          <span
            v-if="vehicle.plate"
            class="font-label-sm text-label-sm uppercase text-on-surface-variant"
          >
            · {{ vehicle.plate }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 text-sm text-on-surface-variant">
        <MaterialIcon name="speed" class="text-base text-primary" />
        {{ formatKm(vehicle.odometerKm) }}
      </div>

      <div
        v-if="vehicleAlerts.length"
        class="space-y-1"
      >
        <div
          v-for="(alert, i) in vehicleAlerts.slice(0, 2)"
          :key="i"
          class="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
          :class="alert.status === 'overdue' || alert.status === 'expired' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'"
        >
          <MaterialIcon name="warning" class="text-sm" />
          {{ alert.label }}
        </div>
        <p
          v-if="vehicleAlerts.length > 2"
          class="pl-1 text-xs text-on-surface-variant"
        >
          +{{ vehicleAlerts.length - 2 }} más
        </p>
      </div>

      <div class="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-3">
        <span
          class="font-label-sm text-xs uppercase"
          :class="statusColor[vehicle.status]"
        >
          {{ VEHICLE_STATUS_LABELS[vehicle.status] }}
        </span>
        <div
          class="flex gap-1"
          @click.stop
        >
          <button
            v-if="!vehicle.isPrimary && vehicle.status === 'active'"
            type="button"
            class="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            title="Marcar como principal"
            @click="emit('setPrimary', vehicle.id)"
          >
            <MaterialIcon name="star" class="text-base" />
          </button>
          <button
            type="button"
            class="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
            title="Eliminar moto"
            @click="emit('delete', vehicle.id)"
          >
            <MaterialIcon name="delete" class="text-base" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
