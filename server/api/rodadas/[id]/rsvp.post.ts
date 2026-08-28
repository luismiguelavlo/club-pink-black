export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  return joinEventRsvp({
    eventId: id,
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    machine: session.user.motorcycle,
  })
})
