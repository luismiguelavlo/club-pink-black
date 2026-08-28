<script setup lang="ts">
import type { VehicleDocument } from '~/types/garage'
import { DOCUMENT_KIND_LABELS } from '~/types/garage'
import { formatDateEs } from '~/utils/format'

defineProps<{
  document: VehicleDocument
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const statusClasses: Record<string, string> = {
  ok: 'border-outline-variant/20 bg-surface-container-low/30',
  expiring: 'border-primary/30 bg-primary/5',
  expired: 'border-error/30 bg-error/5',
}

const badgeClasses: Record<string, string> = {
  ok: 'bg-primary/20 text-primary',
  expiring: 'bg-primary/20 text-primary',
  expired: 'bg-error/20 text-error',
}

const badgeText: Record<string, string> = {
  ok: 'Vigente',
  expiring: 'Por vencer',
  expired: 'Vencido',
}
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-xl border p-4 transition-colors"
    :class="statusClasses[document.documentStatus]"
  >
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest">
      <MaterialIcon name="description" class="text-primary" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <p class="font-medium text-on-surface">
          {{ DOCUMENT_KIND_LABELS[document.kind] }}
        </p>
        <span
          class="rounded-full px-2 py-0.5 font-label-sm text-xs uppercase"
          :class="badgeClasses[document.documentStatus]"
        >
          {{ badgeText[document.documentStatus] }}
        </span>
      </div>

      <div class="mt-1 flex flex-wrap gap-x-3 text-xs text-on-surface-variant">
        <span v-if="document.number">No. {{ document.number }}</span>
        <span>Vence: {{ formatDateEs(document.expiresAt) }}</span>
        <span v-if="document.daysUntilExpiry >= 0">
          ({{ document.daysUntilExpiry }} día{{ document.daysUntilExpiry !== 1 ? 's' : '' }})
        </span>
        <span v-else class="text-error">
          (vencido hace {{ Math.abs(document.daysUntilExpiry) }} día{{ Math.abs(document.daysUntilExpiry) !== 1 ? 's' : '' }})
        </span>
      </div>
    </div>

    <button
      type="button"
      class="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-error/10 hover:text-error"
      @click="emit('delete', document.id)"
    >
      <MaterialIcon name="delete" class="text-sm" />
    </button>
  </div>
</template>
