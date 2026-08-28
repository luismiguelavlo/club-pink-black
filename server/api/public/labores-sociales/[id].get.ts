import { getPublishedSocialWorkPost } from '../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const post = await getPublishedSocialWorkPost(id)
  return { post }
})
