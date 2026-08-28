export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const body = await readBody(event)
  const parsed = updateEventSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const startsAt = new Date(parsed.data.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Fecha inválida' })
  }

  const updated = await updateEvent(id, {
    title: parsed.data.title,
    description: parsed.data.description,
    startsAt,
    location: parsed.data.location,
    difficulty: parsed.data.difficulty,
    status: parsed.data.status,
  })

  return { event: updated }
})
