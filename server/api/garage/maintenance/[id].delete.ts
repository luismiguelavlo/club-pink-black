import { eq } from 'drizzle-orm'
import { maintenanceRecords } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [record] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id))
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })

  await assertVehicleOwnership(record.vehicleId, session.user.id)
  await deleteMaintenanceRecord(id)
  return { ok: true }
})
