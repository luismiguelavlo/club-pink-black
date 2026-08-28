import { createPostSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const parsed = createPostSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const postId = await createPost({
    authorId: session.user.id,
    body: parsed.data.body,
  })

  const posts = await listFeedPosts({
    id: session.user.id,
    role: session.user.role,
  })

  const post = posts.find((item) => item.id === postId)

  if (!post) {
    throw createError({ statusCode: 500, statusMessage: 'Publicación creada pero no encontrada' })
  }

  return { post }
})
