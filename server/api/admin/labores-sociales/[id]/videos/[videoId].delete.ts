import { assertAdmin } from '../../../../../utils/auth'
import { deleteSocialWorkVideo } from '../../../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  const videoId = getRouterParam(event, 'videoId')

  if (!id || !videoId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const post = await deleteSocialWorkVideo(id, videoId)
  return { post }
})
