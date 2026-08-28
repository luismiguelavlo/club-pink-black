import { loginSchema } from '../../utils/validation'
import { findUserByEmail, toPublicUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const user = await findUserByEmail(parsed.data.email)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas',
    })
  }

  if (!user.isActive) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tu cuenta está pendiente de activación. Un administrador debe habilitarla antes de iniciar sesión.',
    })
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password)

  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas',
    })
  }

  const publicUser = toPublicUser(user)

  await setUserSession(event, {
    user: publicUser,
  })

  return { user: publicUser }
})
