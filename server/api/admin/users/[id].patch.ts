import { assertAdmin, updateAdminUser } from '../../../utils/auth'
import { adminUpdateUserSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const body = await readBody(event)
  const parsed = adminUpdateUserSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const user = await updateAdminUser(session.user.id, id, parsed.data)
  return { user }
})
