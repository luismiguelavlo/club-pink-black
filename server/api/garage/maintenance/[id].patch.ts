import { eq } from 'drizzle-orm'
import { maintenanceRecords } from '../../../database/schema'
import { updateMaintenanceSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [record] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id))
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })

  await assertVehicleOwnership(record.vehicleId, session.user.id)

  const body = await readBody(event)
  const parsed = updateMaintenanceSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
  }

  const updated = await updateMaintenanceRecord(id, parsed.data)
  return { record: updated }
})
