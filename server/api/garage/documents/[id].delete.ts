import { eq } from 'drizzle-orm'
import { vehicleDocuments } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [doc] = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, id))
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Documento no encontrado' })

  await assertVehicleOwnership(doc.vehicleId, session.user.id)
  await deleteDocument(id)
  return { ok: true }
})
