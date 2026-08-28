<script setup lang="ts">
import type { VehicleStats } from '~/types/garage'
import { formatCop } from '~/utils/format'

defineProps<{
  stats: VehicleStats
  odometerKm: number
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
      <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Total invertido</p>
      <p class="mt-2 font-headline-lg text-2xl text-primary">
        {{ formatCop(stats.totalExpenses) }}
      </p>
    </div>

    <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
      <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Promedio mensual</p>
      <p class="mt-2 font-headline-lg text-2xl text-on-surface">
        {{ formatCop(stats.avgMonthly) }}
      </p>
    </div>

    <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
      <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Costo por km</p>
      <p class="mt-2 font-headline-lg text-2xl text-on-surface">
        {{ stats.costPerKm !== null ? formatCop(stats.costPerKm) : '–' }}
      </p>
      <p v-if="odometerKm > 0" class="mt-1 text-xs text-on-surface-variant">
        sobre {{ odometerKm.toLocaleString('es-CO') }} km
      </p>
    </div>
  </div>
</template>
