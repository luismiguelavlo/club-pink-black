import { assertAdmin } from '../../../utils/auth'
import { createSocialWorkPost } from '../../../utils/social-work'
import { createSocialWorkSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const body = await readBody(event)
  const parsed = createSocialWorkSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const post = await createSocialWorkPost({
    createdById: session.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
  })

  return { post }
})
