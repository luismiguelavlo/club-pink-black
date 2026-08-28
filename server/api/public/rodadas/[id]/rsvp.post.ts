import { createEventRsvp } from '../../../../utils/public-site'
import { eventRsvpSchema } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'id')

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de rodada requerido',
    })
  }

  const body = await readBody(event)
  const parsed = eventRsvpSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const rsvp = await createEventRsvp(eventId, parsed.data)

  return {
    ok: true,
    rsvp,
    message: `Reserva confirmada para ${rsvp.eventTitle}`,
  }
})
