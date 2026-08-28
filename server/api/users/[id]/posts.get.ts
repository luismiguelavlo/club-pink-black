import { listUserPosts } from '../../../utils/feed'
import { assertProfileAccessible } from '../../../utils/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  await assertProfileAccessible(userId, session.user.id)

  const posts = await listUserPosts(userId, {
    id: session.user.id,
    role: session.user.role,
  })

  return { posts }
})
