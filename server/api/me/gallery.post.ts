import { uploadUserGalleryImage } from '../../utils/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const form = await readMultipartFormData(event)

  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No se recibió ningún archivo' })
  }

  const filePart = form.find((part) => part.name === 'file' && part.data && part.filename)

  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo de imagen requerido' })
  }

  const gallery = await uploadUserGalleryImage(session.user.id, {
    buffer: Buffer.from(filePart.data),
    filename: filePart.filename,
    mimeType: filePart.type || 'application/octet-stream',
  })

  return { gallery }
})
