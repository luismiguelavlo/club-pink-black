import { updateOwnProfile } from '../../utils/auth'
import { updateProfileSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const user = await updateOwnProfile(session.user.id, parsed.data)

  await setUserSession(event, { user })

  return { user }
})
