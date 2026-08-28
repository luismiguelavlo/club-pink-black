<script setup lang="ts">
import type { MaintenanceRecord } from '~/types/garage'
import { MAINTENANCE_TYPE_LABELS } from '~/types/garage'
import { formatCop, formatDateEs, formatKm } from '~/utils/format'

defineProps<{
  records: MaintenanceRecord[]
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <div
    v-if="records.length === 0"
    class="py-12 text-center text-on-surface-variant"
  >
    <MaterialIcon name="build" class="mb-3 text-5xl text-outline-variant" />
    <p>Sin registros de mantenimiento todavía.</p>
  </div>

  <div
    v-else
    class="space-y-4"
  >
    <div
      v-for="record in records"
      :key="record.id"
      class="flex gap-4"
    >
      <div class="flex flex-col items-center">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <MaterialIcon name="build" class="text-sm text-primary" />
        </div>
        <div class="mt-1 w-px flex-1 bg-outline-variant/20" />
      </div>

      <div class="mb-4 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-medium text-on-surface">
              {{ record.title }}
            </p>
            <p class="mt-0.5 font-label-sm text-label-sm uppercase text-primary">
              {{ MAINTENANCE_TYPE_LABELS[record.type] }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error"
            @click="emit('delete', record.id)"
          >
            <MaterialIcon name="delete" class="text-sm" />
          </button>
        </div>

        <div class="mt-3 flex flex-wrap gap-3 text-sm text-on-surface-variant">
          <span class="flex items-center gap-1">
            <MaterialIcon name="calendar_today" class="text-sm" />
            {{ formatDateEs(record.performedAt) }}
          </span>
          <span
            v-if="record.odometerKm"
            class="flex items-center gap-1"
          >
            <MaterialIcon name="speed" class="text-sm" />
            {{ formatKm(record.odometerKm) }}
          </span>
          <span
            v-if="record.cost"
            class="flex items-center gap-1"
          >
            <MaterialIcon name="attach_money" class="text-sm" />
            {{ formatCop(record.cost) }}
          </span>
          <span
            v-if="record.workshop"
            class="flex items-center gap-1"
          >
            <MaterialIcon name="store" class="text-sm" />
            {{ record.workshop }}
          </span>
        </div>

        <p
          v-if="record.notes"
          class="mt-2 text-sm text-on-surface-variant"
        >
          {{ record.notes }}
        </p>
      </div>
    </div>
  </div>
</template>
