import { listUserPosts } from '../../../../utils/feed'
import { assertPublicProfileAccessible } from '../../../../utils/profile'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  await assertPublicProfileAccessible(userId)

  const posts = await listUserPosts(userId, { id: '', role: 'user' })
  return { posts }
})
