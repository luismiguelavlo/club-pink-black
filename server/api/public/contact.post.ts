import { createContactRequest } from '../../utils/public-site'
import { contactRequestSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = contactRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const row = await createContactRequest(parsed.data)

  return {
    ok: true,
    id: row.id,
    message: 'Solicitud recibida. Te contactaremos pronto.',
  }
})
