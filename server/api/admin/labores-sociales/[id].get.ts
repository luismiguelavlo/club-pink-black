import { assertAdmin } from '../../../utils/auth'
import { getSocialWorkPost } from '../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const post = await getSocialWorkPost(id)
  return { post }
})
