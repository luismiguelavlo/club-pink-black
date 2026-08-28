<script setup lang="ts">
import type { MaintenanceReminder } from '~/types/garage'
import { MAINTENANCE_TYPE_LABELS } from '~/types/garage'
import { formatKm, formatDateEs } from '~/utils/format'

defineProps<{
  reminder: MaintenanceReminder
}>()

const emit = defineEmits<{
  complete: [id: string]
  delete: [id: string]
}>()

const statusClasses: Record<string, string> = {
  ok: 'border-outline-variant/20 bg-surface-container-low/30',
  due_soon: 'border-primary/30 bg-primary/5',
  overdue: 'border-error/30 bg-error/5',
}

const statusBadge: Record<string, { text: string; cls: string }> = {
  ok: { text: 'Al día', cls: 'text-on-surface-variant' },
  due_soon: { text: 'Próximo', cls: 'text-primary' },
  overdue: { text: 'Vencido', cls: 'text-error' },
}
</script>

<template>
  <div
    class="rounded-xl border p-4 transition-colors"
    :class="statusClasses[reminder.reminderStatus.status]"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="font-medium text-on-surface">
          {{ reminder.title }}
        </p>
        <p class="font-label-sm text-xs uppercase text-primary">
          {{ MAINTENANCE_TYPE_LABELS[reminder.type] }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <span
          class="font-label-sm text-xs font-medium uppercase"
          :class="statusBadge[reminder.reminderStatus.status]?.cls"
        >
          {{ statusBadge[reminder.reminderStatus.status]?.text }}
        </span>
        <button
          type="button"
          class="rounded-lg p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error"
          @click="emit('delete', reminder.id)"
        >
          <MaterialIcon name="delete" class="text-sm" />
        </button>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-3 text-sm text-on-surface-variant">
      <span v-if="reminder.intervalKm" class="flex items-center gap-1">
        <MaterialIcon name="speed" class="text-sm text-primary" />
        Cada {{ formatKm(reminder.intervalKm) }}
      </span>
      <span v-if="reminder.intervalMonths" class="flex items-center gap-1">
        <MaterialIcon name="calendar_month" class="text-sm text-primary" />
        Cada {{ reminder.intervalMonths }} mes{{ reminder.intervalMonths > 1 ? 'es' : '' }}
      </span>
    </div>

    <div class="mt-2 space-y-1 text-xs text-on-surface-variant">
      <p v-if="reminder.reminderStatus.kmRemaining !== null">
        <template v-if="reminder.reminderStatus.kmRemaining > 0">
          Faltan {{ formatKm(reminder.reminderStatus.kmRemaining) }}
        </template>
        <template v-else>
          Superado por {{ formatKm(Math.abs(reminder.reminderStatus.kmRemaining)) }}
        </template>
      </p>
      <p v-if="reminder.reminderStatus.daysRemaining !== null">
        <template v-if="reminder.reminderStatus.daysRemaining > 0">
          En {{ reminder.reminderStatus.daysRemaining }} día{{ reminder.reminderStatus.daysRemaining !== 1 ? 's' : '' }}
        </template>
        <template v-else>
          Hace {{ Math.abs(reminder.reminderStatus.daysRemaining) }} día{{ Math.abs(reminder.reminderStatus.daysRemaining) !== 1 ? 's' : '' }}
        </template>
      </p>
      <p v-if="reminder.lastDoneAt">
        Último: {{ formatDateEs(reminder.lastDoneAt) }}
      </p>
    </div>

    <div class="mt-4">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-primary/20 hover:text-primary"
        @click="emit('complete', reminder.id)"
      >
        <MaterialIcon name="check_circle" class="text-base" />
        Ya lo hice
      </button>
    </div>
  </div>
</template>
