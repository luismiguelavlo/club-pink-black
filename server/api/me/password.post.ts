import { changeOwnPassword } from '../../utils/auth'
import { changePasswordSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const parsed = changePasswordSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  await changeOwnPassword(session.user.id, parsed.data)

  return { ok: true, message: 'Contraseña actualizada' }
})
