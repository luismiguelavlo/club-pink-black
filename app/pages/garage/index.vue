<script setup lang="ts">
import { formatCop } from '~/utils/format'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

useSeoMeta({ title: 'Mi Garaje | Pink & Black' })

const { vehicles, alerts, urgentAlerts, monthExpenses, totalExpenses, pending, error, createVehicleEntry, deleteVehicleEntry, refresh } = useGarage()

const showAddModal = ref(false)
const deletingId = ref<string | null>(null)

function goToVehicle(id: string) {
  navigateTo(`/garage/${id}`)
}

async function onSaved() {
  await refresh()
  showAddModal.value = false
}

async function confirmDelete(id: string) {
  if (!confirm('¿Eliminar esta moto? Se eliminarán todos sus registros.')) return
  deletingId.value = id
  try {
    await deleteVehicleEntry(id)
  }
  finally {
    deletingId.value = null
  }
}

async function onSetPrimary(id: string) {
  await $fetch(`/api/garage/vehicles/${id}/primary`, { method: 'POST' })
  await refresh()
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-8 p-gutter-mobile md:p-gutter-desktop">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">Mi espacio</span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
          Mi Garaje
        </h1>
      </div>
      <AppButton @click="showAddModal = true">
        <MaterialIcon name="add" />
        Agregar moto
      </AppButton>
    </div>

    <!-- Alertas urgentes -->
    <div v-if="urgentAlerts.length">
      <h2 class="mb-3 font-label-sm text-label-sm uppercase tracking-[0.2em] text-error">
        Atención requerida
      </h2>
      <GarageAlertsPanel :alerts="urgentAlerts" />
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
        <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Motos</p>
        <p class="mt-2 font-headline-lg text-3xl text-on-surface">
          {{ vehicles.length }}
        </p>
      </div>
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
        <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Gasto este mes</p>
        <p class="mt-2 font-headline-lg text-2xl text-primary">
          {{ formatCop(monthExpenses) }}
        </p>
      </div>
      <div class="col-span-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5 sm:col-span-1">
        <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Total invertido</p>
        <p class="mt-2 font-headline-lg text-2xl text-on-surface">
          {{ formatCop(totalExpenses) }}
        </p>
      </div>
    </div>

    <!-- Alertas suaves -->
    <div v-if="alerts.length - urgentAlerts.length > 0">
      <h2 class="mb-3 font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">
        Próximas revisiones
      </h2>
      <GarageAlertsPanel :alerts="alerts.filter((a) => a.status === 'due_soon' || a.status === 'expiring')" />
    </div>

    <!-- Loading -->
    <div v-if="pending && !vehicles.length" class="py-20 text-center text-on-surface-variant">
      Cargando garaje…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-20 text-center text-error">
      No se pudo cargar el garaje.
    </div>

    <!-- Grid motos -->
    <div v-else>
      <h2 class="mb-4 font-label-sm text-label-sm uppercase tracking-[0.2em] text-on-surface-variant">
        Mis motos
      </h2>

      <div
        v-if="vehicles.length === 0"
        class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline-variant/30 py-20 text-center"
      >
        <MaterialIcon name="two_wheeler" class="text-6xl text-outline-variant" />
        <p class="text-on-surface-variant">Aún no tienes motos registradas.</p>
        <AppButton @click="showAddModal = true">
          Agregar mi primera moto
        </AppButton>
      </div>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <VehicleCard
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :alerts="alerts"
          @select="goToVehicle"
          @delete="confirmDelete"
          @set-primary="onSetPrimary"
        />
      </div>
    </div>

    <VehicleFormModal
      :open="showAddModal"
      @update:open="showAddModal = $event"
      @saved="onSaved"
    />
  </div>
</template>
