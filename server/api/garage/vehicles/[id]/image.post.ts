export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  await assertVehicleOwnership(id, session.user.id)

  if (!isCloudinaryConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Servicio de imágenes no disponible' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find((f) => f.name === 'image')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'No se encontró la imagen' })

  const maxBytes = 5 * 1024 * 1024
  if (file.data.length > maxBytes) throw createError({ statusCode: 400, statusMessage: 'La imagen no puede superar 5 MB' })

  const uploaded = await uploadImageToCloudinary(file.data, file.type ?? 'image/jpeg', 'vehicles')
  const vehicle = await setVehicleImage(id, uploaded.secure_url, uploaded.public_id)
  return { vehicle }
})
