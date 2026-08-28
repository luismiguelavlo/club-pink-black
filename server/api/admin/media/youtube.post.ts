export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const body = await readBody(event)
  const parsed = createYoutubeMediaSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const item = await createYoutubeMedia({
    createdById: session.user.id,
    title: parsed.data.title,
    videoUrl: parsed.data.videoUrl,
  })

  return { item }
})
