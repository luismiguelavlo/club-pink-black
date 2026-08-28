import { eq } from 'drizzle-orm'
import { vehicleDocuments } from '../../../database/schema'
import { updateDocumentSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [doc] = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, id))
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Documento no encontrado' })

  await assertVehicleOwnership(doc.vehicleId, session.user.id)

  const body = await readBody(event)
  const parsed = updateDocumentSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
  }

  const updated = await updateDocument(id, parsed.data)
  return { document: updated }
})
