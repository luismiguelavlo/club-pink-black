export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const form = await readMultipartFormData(event)

  if (!form?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No se recibió ningún archivo',
    })
  }

  const filePart = form.find((part) => part.name === 'file' && part.data && part.filename)
  const titlePart = form.find((part) => part.name === 'title')

  if (!filePart?.data || !filePart.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Archivo de imagen requerido',
    })
  }

  const title =
    titlePart?.data?.toString('utf8')?.trim() ||
    filePart.filename.replace(/\.[^.]+$/, '')

  const item = await createPhotoMedia({
    createdById: session.user.id,
    title,
    buffer: Buffer.from(filePart.data),
    filename: filePart.filename,
    mimeType: filePart.type || 'application/octet-stream',
  })

  return { item }
})
