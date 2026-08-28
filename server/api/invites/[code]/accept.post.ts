export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  const body = await readBody(event)
  const parsed = acceptInviteSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  return acceptInvite(event, {
    code,
    ...parsed.data,
  })
})
