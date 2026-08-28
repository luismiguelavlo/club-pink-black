<script setup lang="ts">
import { formatCop, formatDateEs, formatKm } from '~/utils/format'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const vehicleId = computed(() => route.params.id as string)

useSeoMeta({ title: 'Detalle de moto | Mi Garaje | Pink & Black' })

const {
  vehicle,
  vehiclePending,
  maintenanceRecords,
  expenses,
  reminders,
  documents,
  stats,
  removeMaintenance,
  removeExpense,
  removeReminder,
  completeReminderEntry,
  removeDocument,
  uploadVehicleImage,
  setPrimary,
  refreshVehicle,
  refreshMaintenance,
  refreshExpenses,
  refreshReminders,
  refreshDocuments,
  refreshStats,
} = useVehicleDetail(vehicleId)

type Tab = 'overview' | 'maintenance' | 'expenses' | 'reminders' | 'documents'
const activeTab = ref<Tab>((route.query.tab as Tab) ?? 'overview')

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Resumen', icon: 'dashboard' },
  { id: 'maintenance', label: 'Mantenimientos', icon: 'build' },
  { id: 'expenses', label: 'Gastos', icon: 'receipt_long' },
  { id: 'reminders', label: 'Recordatorios', icon: 'alarm' },
  { id: 'documents', label: 'Documentos', icon: 'description' },
]

// Modals
const showMaintModal = ref(false)
const showExpenseModal = ref(false)
const showReminderModal = ref(false)
const showDocumentModal = ref(false)
const showEditModal = ref(false)

// Image upload
const imageInput = ref<HTMLInputElement | null>(null)
const uploadingImage = ref(false)

async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingImage.value = true
  try {
    await uploadVehicleImage(file)
  }
  finally {
    uploadingImage.value = false
  }
}

async function handleDelete(type: string, id: string) {
  if (!confirm(`¿Eliminar este ${type}?`)) return
  if (type === 'mantenimiento') await removeMaintenance(id)
  else if (type === 'gasto') await removeExpense(id)
  else if (type === 'recordatorio') await removeReminder(id)
  else if (type === 'documento') await removeDocument(id)
}

async function handleCompleteReminder(id: string) {
  const odometer = prompt('¿Lectura actual del odómetro? (deja en blanco para omitir)')
  await completeReminderEntry(id, odometer ? { odometerKm: Number(odometer) } : {})
}

const alertCount = computed(() => {
  const rCount = reminders.value.filter((r) => r.reminderStatus.status !== 'ok').length
  const dCount = documents.value.filter((d) => d.documentStatus !== 'ok').length
  return rCount + dCount
})
</script>

<template>
  <div class="relative flex w-full flex-col p-gutter-mobile md:p-gutter-desktop">
    <!-- Back + header -->
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink
        to="/garage"
        class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high"
      >
        <MaterialIcon name="arrow_back" />
      </NuxtLink>

      <div
        v-if="vehicle"
        class="flex flex-1 items-start justify-between gap-4"
      >
        <div>
          <h1 class="font-headline-xl text-2xl text-on-surface md:text-3xl">
            {{ vehicle.brand }} {{ vehicle.model }}
          </h1>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span class="font-label-sm text-label-sm uppercase text-primary">{{ vehicle.year }}</span>
            <span v-if="vehicle.engineCc" class="text-sm text-on-surface-variant">· {{ vehicle.engineCc }} cc</span>
            <span v-if="vehicle.plate" class="text-sm text-on-surface-variant">· {{ vehicle.plate }}</span>
            <span v-if="vehicle.isPrimary" class="rounded-full bg-primary/20 px-2 py-0.5 font-label-sm text-xs uppercase text-primary">Principal</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high"
            title="Editar"
            @click="showEditModal = true"
          >
            <MaterialIcon name="edit" class="text-sm" />
          </button>
          <button
            v-if="!vehicle.isPrimary"
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            title="Marcar como principal"
            @click="setPrimary()"
          >
            <MaterialIcon name="star" class="text-sm" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="vehiclePending"
      class="py-20 text-center text-on-surface-variant"
    >
      Cargando…
    </div>

    <div v-else-if="vehicle">
      <!-- Photo + hero stats -->
      <div class="mb-6 flex flex-col gap-6 lg:flex-row">
        <div class="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-container-highest lg:max-w-sm">
          <img
            v-if="vehicle.imageUrl"
            :src="vehicle.imageUrl"
            :alt="`${vehicle.brand} ${vehicle.model}`"
            class="h-full w-full object-cover"
          >
          <div
            v-else
            class="flex h-full w-full items-center justify-center"
          >
            <MaterialIcon name="two_wheeler" class="text-7xl text-outline-variant" />
          </div>
          <button
            type="button"
            class="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-surface-container-low/80 px-3 py-2 text-sm text-on-surface backdrop-blur-sm"
            :disabled="uploadingImage"
            @click="imageInput?.click()"
          >
            <MaterialIcon name="photo_camera" class="text-sm" />
            {{ uploadingImage ? 'Subiendo…' : 'Cambiar foto' }}
          </button>
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageChange"
          >
        </div>

        <div class="flex flex-1 flex-col gap-4">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
              <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Odómetro</p>
              <p class="mt-1 font-headline-lg text-xl text-on-surface">
                {{ formatKm(vehicle.odometerKm) }}
              </p>
            </div>
            <div v-if="stats" class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
              <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Total invertido</p>
              <p class="mt-1 font-headline-lg text-xl text-primary">
                {{ formatCop(stats.totalExpenses) }}
              </p>
            </div>
            <div v-if="alertCount > 0" class="rounded-2xl border border-error/30 bg-error/5 p-4">
              <p class="font-label-sm text-label-sm uppercase text-error">Alertas</p>
              <p class="mt-1 font-headline-lg text-xl text-error">
                {{ alertCount }}
              </p>
            </div>
            <div v-if="vehicle.purchaseDate" class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
              <p class="font-label-sm text-label-sm uppercase text-on-surface-variant">Compra</p>
              <p class="mt-1 text-sm text-on-surface">
                {{ formatDateEs(vehicle.purchaseDate) }}
              </p>
            </div>
          </div>
          <p v-if="vehicle.notes" class="text-sm text-on-surface-variant">
            {{ vehicle.notes }}
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low/20 p-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-label-sm text-label-sm uppercase tracking-wider transition-all"
          :class="activeTab === tab.id ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(255,176,202,0.35)]' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'"
          @click="activeTab = tab.id"
        >
          <MaterialIcon :name="tab.icon" class="text-base" />
          <span class="hidden sm:block">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab: Resumen -->
      <div v-if="activeTab === 'overview'" class="space-y-8">
        <VehicleStatsPanel
          v-if="stats"
          :stats="stats"
          :odometer-km="vehicle.odometerKm"
        />
        <div v-if="stats">
          <h3 class="mb-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            Desglose de gastos
          </h3>
          <ExpenseBreakdown :stats="stats" />
        </div>
      </div>

      <!-- Tab: Mantenimientos -->
      <div v-else-if="activeTab === 'maintenance'" class="space-y-4">
        <div class="flex justify-end">
          <AppButton @click="showMaintModal = true">
            <MaterialIcon name="add" />
            Registrar
          </AppButton>
        </div>
        <MaintenanceTimeline
          :records="maintenanceRecords"
          @delete="handleDelete('mantenimiento', $event)"
        />
      </div>

      <!-- Tab: Gastos -->
      <div v-else-if="activeTab === 'expenses'" class="space-y-4">
        <div class="flex justify-end">
          <AppButton @click="showExpenseModal = true">
            <MaterialIcon name="add" />
            Registrar
          </AppButton>
        </div>
        <ExpenseTable
          :expenses="expenses"
          @delete="handleDelete('gasto', $event)"
        />
      </div>

      <!-- Tab: Recordatorios -->
      <div v-else-if="activeTab === 'reminders'" class="space-y-4">
        <div class="flex justify-end">
          <AppButton @click="showReminderModal = true">
            <MaterialIcon name="add" />
            Agregar
          </AppButton>
        </div>
        <div
          v-if="reminders.length === 0"
          class="py-12 text-center text-on-surface-variant"
        >
          <MaterialIcon name="alarm" class="mb-3 text-5xl text-outline-variant" />
          <p>Sin recordatorios configurados todavía.</p>
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2">
          <ReminderCard
            v-for="reminder in reminders"
            :key="reminder.id"
            :reminder="reminder"
            @complete="handleCompleteReminder"
            @delete="handleDelete('recordatorio', $event)"
          />
        </div>
      </div>

      <!-- Tab: Documentos -->
      <div v-else-if="activeTab === 'documents'" class="space-y-4">
        <div class="flex justify-end">
          <AppButton @click="showDocumentModal = true">
            <MaterialIcon name="add" />
            Agregar
          </AppButton>
        </div>
        <div
          v-if="documents.length === 0"
          class="py-12 text-center text-on-surface-variant"
        >
          <MaterialIcon name="description" class="mb-3 text-5xl text-outline-variant" />
          <p>Sin documentos registrados todavía.</p>
        </div>
        <div v-else class="space-y-3">
          <DocumentCard
            v-for="doc in documents"
            :key="doc.id"
            :document="doc"
            @delete="handleDelete('documento', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <MaintenanceFormModal
      :open="showMaintModal"
      :vehicle-id="vehicleId"
      @update:open="showMaintModal = $event"
      @saved="refreshMaintenance(); refreshVehicle(); refreshReminders(); refreshStats(); showMaintModal = false"
    />
    <ExpenseFormModal
      :open="showExpenseModal"
      :vehicle-id="vehicleId"
      @update:open="showExpenseModal = $event"
      @saved="refreshExpenses(); refreshStats(); showExpenseModal = false"
    />
    <ReminderFormModal
      :open="showReminderModal"
      :vehicle-id="vehicleId"
      @update:open="showReminderModal = $event"
      @saved="refreshReminders(); showReminderModal = false"
    />
    <DocumentFormModal
      :open="showDocumentModal"
      :vehicle-id="vehicleId"
      @update:open="showDocumentModal = $event"
      @saved="refreshDocuments(); showDocumentModal = false"
    />
    <VehicleFormModal
      :open="showEditModal"
      :vehicle="vehicle"
      @update:open="showEditModal = $event"
      @saved="refreshVehicle(); showEditModal = false"
    />
  </div>
</template>
