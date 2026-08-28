export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const vehicle = await assertVehicleOwnership(id, session.user.id)
  const reminders = await listReminders(id, vehicle.odometerKm)
  return { reminders }
})
