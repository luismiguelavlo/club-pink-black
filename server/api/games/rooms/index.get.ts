import { listPartyRoomsSchema } from '../../../utils/party-games/validation'
import { listActiveRooms } from '../../../utils/party-games/store'
import { toRoomSummary } from '../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const parsed = listPartyRoomsSchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Filtro inválido',
    })
  }

  const rooms = await listActiveRooms(parsed.data.gameType)

  return {
    rooms: rooms
      .filter((room) => room.players.length > 0)
      .map((room) => toRoomSummary(room, session.user.id)),
  }
})
