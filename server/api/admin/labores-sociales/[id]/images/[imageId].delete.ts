import { assertAdmin } from '../../../../../utils/auth'
import { deleteSocialWorkImage } from '../../../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  const imageId = getRouterParam(event, 'imageId')

  if (!id || !imageId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const post = await deleteSocialWorkImage(id, imageId)
  return { post }
})
