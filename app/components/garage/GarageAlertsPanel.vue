<script setup lang="ts">
import type { GarageAlert } from '~/types/garage'

const props = defineProps<{
  alerts: GarageAlert[]
}>()

const urgent = computed(() => props.alerts.filter((a) => a.status === 'overdue' || a.status === 'expired'))
const soon = computed(() => props.alerts.filter((a) => a.status === 'due_soon' || a.status === 'expiring'))

const alertClass = (status: GarageAlert['status']) => {
  if (status === 'overdue' || status === 'expired') return 'border-error/30 bg-error/10 text-error'
  return 'border-primary/20 bg-primary/10 text-primary'
}

const alertIcon = (type: GarageAlert['type']) => type === 'document' ? 'description' : 'build'
</script>

<template>
  <div
    v-if="alerts.length"
    class="space-y-2"
  >
    <div
      v-for="(alert, i) in alerts"
      :key="i"
      class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      :class="alertClass(alert.status)"
    >
      <MaterialIcon :name="alertIcon(alert.type)" class="shrink-0 text-base" />
      <div class="min-w-0 flex-1">
        <span class="font-medium">{{ alert.vehicleName }}</span>
        <span class="mx-1 text-current/60">·</span>
        <span>{{ alert.label }}</span>
        <span class="ml-1 text-current/60 text-xs">
          {{ alert.status === 'overdue' ? '(vencido)' : alert.status === 'expired' ? '(documento vencido)' : alert.status === 'due_soon' ? '(próximo)' : '(por vencer)' }}
        </span>
      </div>
      <NuxtLink
        :to="alert.href"
        class="shrink-0 rounded-lg px-2 py-1 font-label-sm text-label-sm uppercase transition-colors hover:bg-current/10"
        @click.stop
      >
        Ver
      </NuxtLink>
    </div>
  </div>
</template>
