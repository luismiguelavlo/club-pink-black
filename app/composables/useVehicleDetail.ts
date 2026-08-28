import type {
  MaintenanceRecord,
  MaintenanceReminder,
  Vehicle,
  VehicleDocument,
  VehicleExpense,
  VehicleStats,
} from '~/types/garage'

export function useVehicleDetail(vehicleId: Ref<string>) {
  const vehicleKey = computed(() => `vehicle-${vehicleId.value}`)
  const maintenanceKey = computed(() => `vehicle-maintenance-${vehicleId.value}`)
  const expensesKey = computed(() => `vehicle-expenses-${vehicleId.value}`)
  const remindersKey = computed(() => `vehicle-reminders-${vehicleId.value}`)
  const documentsKey = computed(() => `vehicle-documents-${vehicleId.value}`)
  const statsKey = computed(() => `vehicle-stats-${vehicleId.value}`)

  const { data: vehicleData, refresh: refreshVehicle, pending: vehiclePending } = useFetch<{ vehicle: Vehicle }>(
    () => `/api/garage/vehicles/${vehicleId.value}`,
    { key: vehicleKey.value },
  )

  const { data: maintenanceData, refresh: refreshMaintenance } = useFetch<{ records: MaintenanceRecord[] }>(
    () => `/api/garage/vehicles/${vehicleId.value}/maintenance`,
    { key: maintenanceKey.value },
  )

  const { data: expensesData, refresh: refreshExpenses } = useFetch<{ expenses: VehicleExpense[] }>(
    () => `/api/garage/vehicles/${vehicleId.value}/expenses`,
    { key: expensesKey.value },
  )

  const { data: remindersData, refresh: refreshReminders } = useFetch<{ reminders: MaintenanceReminder[] }>(
    () => `/api/garage/vehicles/${vehicleId.value}/reminders`,
    { key: remindersKey.value },
  )

  const { data: documentsData, refresh: refreshDocuments } = useFetch<{ documents: VehicleDocument[] }>(
    () => `/api/garage/vehicles/${vehicleId.value}/documents`,
    { key: documentsKey.value },
  )

  const { data: statsData, refresh: refreshStats } = useFetch<{ stats: VehicleStats }>(
    () => `/api/garage/vehicles/${vehicleId.value}/stats`,
    { key: statsKey.value },
  )

  const vehicle = computed(() => vehicleData.value?.vehicle ?? null)
  const maintenanceRecords = computed(() => maintenanceData.value?.records ?? [])
  const expenses = computed(() => expensesData.value?.expenses ?? [])
  const reminders = computed(() => remindersData.value?.reminders ?? [])
  const documents = computed(() => documentsData.value?.documents ?? [])
  const stats = computed(() => statsData.value?.stats ?? null)

  // ─── Mutations ────────────────────────────────────────────────────────────

  async function updateVehicleInfo(form: Record<string, unknown>) {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}`, { method: 'PATCH', body: form })
    await refreshVehicle()
  }

  async function uploadVehicleImage(file: File) {
    const fd = new FormData()
    fd.append('image', file)
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/image`, { method: 'POST', body: fd })
    await refreshVehicle()
  }

  async function setPrimary() {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/primary`, { method: 'POST' })
    await refreshVehicle()
  }

  async function addMaintenance(form: Record<string, unknown>) {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/maintenance`, { method: 'POST', body: form })
    await Promise.all([refreshMaintenance(), refreshVehicle(), refreshReminders(), refreshStats()])
  }

  async function editMaintenance(recordId: string, form: Record<string, unknown>) {
    await $fetch(`/api/garage/maintenance/${recordId}`, { method: 'PATCH', body: form })
    await refreshMaintenance()
  }

  async function removeMaintenance(recordId: string) {
    await $fetch(`/api/garage/maintenance/${recordId}`, { method: 'DELETE' })
    await Promise.all([refreshMaintenance(), refreshStats()])
  }

  async function addExpense(form: Record<string, unknown>) {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/expenses`, { method: 'POST', body: form })
    await Promise.all([refreshExpenses(), refreshStats()])
  }

  async function removeExpense(expenseId: string) {
    await $fetch(`/api/garage/expenses/${expenseId}`, { method: 'DELETE' })
    await Promise.all([refreshExpenses(), refreshStats()])
  }

  async function addReminder(form: Record<string, unknown>) {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/reminders`, { method: 'POST', body: form })
    await refreshReminders()
  }

  async function editReminder(reminderId: string, form: Record<string, unknown>) {
    await $fetch(`/api/garage/reminders/${reminderId}`, { method: 'PATCH', body: form })
    await refreshReminders()
  }

  async function removeReminder(reminderId: string) {
    await $fetch(`/api/garage/reminders/${reminderId}`, { method: 'DELETE' })
    await refreshReminders()
  }

  async function completeReminderEntry(reminderId: string, form: Record<string, unknown> = {}) {
    await $fetch(`/api/garage/reminders/${reminderId}/complete`, { method: 'POST', body: form })
    await Promise.all([refreshReminders(), refreshVehicle()])
  }

  async function addDocument(form: Record<string, unknown>) {
    await $fetch(`/api/garage/vehicles/${vehicleId.value}/documents`, { method: 'POST', body: form })
    await refreshDocuments()
  }

  async function editDocument(documentId: string, form: Record<string, unknown>) {
    await $fetch(`/api/garage/documents/${documentId}`, { method: 'PATCH', body: form })
    await refreshDocuments()
  }

  async function removeDocument(documentId: string) {
    await $fetch(`/api/garage/documents/${documentId}`, { method: 'DELETE' })
    await refreshDocuments()
  }

  return {
    vehicle,
    vehiclePending,
    maintenanceRecords,
    expenses,
    reminders,
    documents,
    stats,
    updateVehicleInfo,
    uploadVehicleImage,
    setPrimary,
    addMaintenance,
    editMaintenance,
    removeMaintenance,
    addExpense,
    removeExpense,
    addReminder,
    editReminder,
    removeReminder,
    completeReminderEntry,
    addDocument,
    editDocument,
    removeDocument,
    refreshVehicle,
    refreshMaintenance,
    refreshExpenses,
    refreshReminders,
    refreshDocuments,
    refreshStats,
  }
}
