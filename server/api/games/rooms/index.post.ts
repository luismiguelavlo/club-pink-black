import { createPartyRoomSchema } from '../../../utils/party-games/validation'
import { createRoomCode, newRoomBase, saveRoom } from '../../../utils/party-games/store'
import { getPlayerLimits } from '../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const parsed = createPartyRoomSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const code = createRoomCode()
  const room = newRoomBase({
    code,
    gameType: parsed.data.gameType,
    hostUserId: session.user.id,
    hostName: session.user.name,
    hostAvatarUrl: session.user.avatarUrl ?? null,
  })

  saveRoom(room)

  const limits = getPlayerLimits(room.gameType)

  return {
    room: {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      playerCount: room.players.length,
      limits,
    },
  }
})
