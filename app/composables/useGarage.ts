import type { GarageOverview, Vehicle } from '~/types/garage'

export function useGarage() {
  const { data, pending, error, refresh } = useFetch<GarageOverview>('/api/garage', {
    key: 'garage-overview',
  })

  const vehicles = computed(() => data.value?.vehicles ?? [])
  const alerts = computed(() => data.value?.alerts ?? [])
  const monthExpenses = computed(() => data.value?.monthExpenses ?? 0)
  const totalExpenses = computed(() => data.value?.totalExpenses ?? 0)
  const urgentAlerts = computed(() => alerts.value.filter((a) => a.status === 'overdue' || a.status === 'expired'))

  async function createVehicleEntry(form: Record<string, unknown>): Promise<Vehicle> {
    const result = await $fetch<{ vehicle: Vehicle }>('/api/garage/vehicles', {
      method: 'POST',
      body: form,
    })
    await refresh()
    return result.vehicle
  }

  async function deleteVehicleEntry(vehicleId: string) {
    await $fetch(`/api/garage/vehicles/${vehicleId}`, { method: 'DELETE' })
    await refresh()
  }

  return {
    data,
    pending,
    error,
    refresh,
    vehicles,
    alerts,
    urgentAlerts,
    monthExpenses,
    totalExpenses,
    createVehicleEntry,
    deleteVehicleEntry,
  }
}
