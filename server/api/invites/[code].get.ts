export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  const invite = await getPublicInvitePreview(code)
  return { invite }
})
