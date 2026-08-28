export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const body = await readBody<{ body?: string }>(event)
  const text = body?.body?.trim() ?? ''

  const created = await createComment({
    postId: id,
    authorId: session.user.id,
    authorName: session.user.name,
    body: text,
  })

  return {
    comment: {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      author: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        motorcycle: session.user.motorcycle ?? null,
      },
      canDelete: true,
    },
  }
})
