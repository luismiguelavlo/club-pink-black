import { assertAdmin } from '../../../../utils/auth'
import { addSocialWorkVideo } from '../../../../utils/social-work'
import { addSocialWorkVideoSchema } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const body = await readBody(event)
  const parsed = addSocialWorkVideoSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const post = await addSocialWorkVideo(id, parsed.data)
  return { post }
})
