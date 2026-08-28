import { deleteUserGalleryImage } from '../../../utils/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const imageId = getRouterParam(event, 'imageId')

  if (!imageId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de imagen requerido' })
  }

  await deleteUserGalleryImage(session.user.id, imageId)

  return { ok: true }
})
