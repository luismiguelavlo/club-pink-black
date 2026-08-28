export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  await deletePost({
    postId: id,
    viewerId: session.user.id,
    viewerRole: session.user.role,
  })

  return { ok: true }
})
