<script setup lang="ts">
import type { VehicleExpense } from '~/types/garage'
import { EXPENSE_CATEGORY_LABELS } from '~/types/garage'
import { formatCop, formatDateEs } from '~/utils/format'

defineProps<{
  expenses: VehicleExpense[]
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <div
    v-if="expenses.length === 0"
    class="py-12 text-center text-on-surface-variant"
  >
    <MaterialIcon name="receipt_long" class="mb-3 text-5xl text-outline-variant" />
    <p>Sin gastos registrados todavía.</p>
  </div>

  <div
    v-else
    class="space-y-2"
  >
    <div
      v-for="expense in expenses"
      :key="expense.id"
      class="flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 px-4 py-3"
    >
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest">
        <MaterialIcon name="receipt" class="text-primary" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-on-surface">
          {{ expense.description }}
        </p>
        <div class="flex flex-wrap gap-x-3 gap-y-0.5">
          <span class="font-label-sm text-xs uppercase text-primary">{{ EXPENSE_CATEGORY_LABELS[expense.category] }}</span>
          <span class="text-xs text-on-surface-variant">{{ formatDateEs(expense.spentAt) }}</span>
        </div>
      </div>

      <div class="shrink-0 text-right">
        <p class="font-medium text-on-surface">
          {{ formatCop(expense.amount) }}
        </p>
        <p
          v-if="expense.liters"
          class="text-xs text-on-surface-variant"
        >
          {{ expense.liters }} L
        </p>
      </div>

      <button
        type="button"
        class="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-error/10 hover:text-error"
        @click="emit('delete', expense.id)"
      >
        <MaterialIcon name="delete" class="text-sm" />
      </button>
    </div>
  </div>
</template>
