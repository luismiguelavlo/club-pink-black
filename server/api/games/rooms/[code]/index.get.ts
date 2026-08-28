import { getRoom } from '../../../../utils/party-games/store'
import { tickRoom, toRoomView } from '../../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  const room = getRoom(code)

  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Sala no encontrada' })
  }

  if (!room.players.some((p) => p.userId === session.user.id)) {
    throw createError({ statusCode: 403, statusMessage: 'No estás en esta sala' })
  }

  tickRoom(room)

  return {
    room: toRoomView(room, session.user.id),
  }
})
