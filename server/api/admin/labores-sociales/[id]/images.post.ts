import { assertAdmin } from '../../../../utils/auth'
import { addSocialWorkImages } from '../../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const form = await readMultipartFormData(event)
  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No se recibieron imágenes' })
  }

  const files = form
    .filter((part) => part.name === 'images' && part.filename && part.data)
    .map((part) => ({
      buffer: Buffer.from(part.data!),
      filename: part.filename!,
      mimeType: part.type || 'application/octet-stream',
    }))

  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'Archivos de imagen requeridos' })
  }

  const post = await addSocialWorkImages(id, files)
  return { post }
})
