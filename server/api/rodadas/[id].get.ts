export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const found = await getEventById(id)
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Rodada no encontrada' })
  }

  return { event: found }
})
