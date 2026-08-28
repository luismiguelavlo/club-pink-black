<script setup lang="ts">
import type { VehicleStats } from '~/types/garage'
import { EXPENSE_CATEGORY_LABELS } from '~/types/garage'
import { formatCop, formatMonthLabel } from '~/utils/format'

const props = defineProps<{
  stats: VehicleStats
}>()

const maxAmount = computed(() =>
  Math.max(...props.stats.byCategory.map((c) => c.total), 1),
)

const maxMonth = computed(() =>
  Math.max(...props.stats.byMonth.map((m) => m.total), 1),
)
</script>

<template>
  <div class="space-y-8">
    <div v-if="stats.byCategory.length">
      <h4 class="mb-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
        Por categoría
      </h4>
      <div class="space-y-3">
        <div
          v-for="item in stats.byCategory"
          :key="item.category"
          class="space-y-1"
        >
          <div class="flex justify-between text-sm">
            <span class="text-on-surface-variant">{{ EXPENSE_CATEGORY_LABELS[item.category] }}</span>
            <span class="font-medium text-on-surface">{{ formatCop(item.total) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${(item.total / maxAmount) * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <div>
      <h4 class="mb-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
        Últimos 12 meses
      </h4>
      <div class="flex items-end gap-1 overflow-x-auto pb-2">
        <div
          v-for="item in stats.byMonth"
          :key="item.month"
          class="flex min-w-[36px] flex-1 flex-col items-center gap-1"
        >
          <p class="text-xs text-on-surface-variant">
            {{ item.total > 0 ? formatCop(item.total) : '' }}
          </p>
          <div
            class="w-full rounded-t-sm bg-primary/60 transition-all duration-500"
            :style="{ height: `${Math.max((item.total / maxMonth) * 80, item.total > 0 ? 4 : 0)}px` }"
          />
          <p class="text-xs text-on-surface-variant">
            {{ formatMonthLabel(item.month) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
