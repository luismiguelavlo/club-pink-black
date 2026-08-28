export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  return toggleIgnite({
    postId: id,
    userId: session.user.id,
    userName: session.user.name,
  })
})
