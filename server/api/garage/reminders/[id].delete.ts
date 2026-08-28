import { eq } from 'drizzle-orm'
import { maintenanceReminders } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [reminder] = await db.select().from(maintenanceReminders).where(eq(maintenanceReminders.id, id))
  if (!reminder) throw createError({ statusCode: 404, statusMessage: 'Recordatorio no encontrado' })

  await assertVehicleOwnership(reminder.vehicleId, session.user.id)
  await deleteReminder(id)
  return { ok: true }
})
