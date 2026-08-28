import { partyGameActionSchema } from '../../../../utils/party-games/validation'
import { getRoom } from '../../../../utils/party-games/store'
import { handleAction, toRoomView } from '../../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const body = await readBody(event)
  const parsed = partyGameActionSchema.safeParse(body)

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Acción inválida',
    })
  }

  const room = await getRoom(code)

  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Sala no encontrada' })
  }

  if (!room.players.some((p) => p.userId === session.user.id)) {
    throw createError({ statusCode: 403, statusMessage: 'No estás en esta sala' })
  }

  await handleAction(room, session.user.id, parsed.data)

  return {
    room: toRoomView(room, session.user.id),
  }
})
