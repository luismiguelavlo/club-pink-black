import { eq } from 'drizzle-orm'
import { maintenanceReminders, vehicles } from '../../../database/schema'
import { updateReminderSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [reminder] = await db.select().from(maintenanceReminders).where(eq(maintenanceReminders.id, id))
  if (!reminder) throw createError({ statusCode: 404, statusMessage: 'Recordatorio no encontrado' })

  const vehicle = await assertVehicleOwnership(reminder.vehicleId, session.user.id)

  const body = await readBody(event)
  const parsed = updateReminderSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
  }

  const updated = await updateReminder(id, parsed.data, vehicle.odometerKm)
  return { reminder: updated }
})
