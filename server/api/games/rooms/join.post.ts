import { joinPartyRoomSchema } from '../../../utils/party-games/validation'
import { getRoom } from '../../../utils/party-games/store'
import { addPlayerToRoom, getPlayerLimits } from '../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const parsed = joinPartyRoomSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Código inválido',
    })
  }

  const code = parsed.data.code.toUpperCase()
  const room = await getRoom(code)

  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Sala no encontrada' })
  }

  if (parsed.data.gameType && room.gameType !== parsed.data.gameType) {
    throw createError({ statusCode: 400, statusMessage: 'Este código es de otro juego' })
  }

  await addPlayerToRoom(room, {
    id: session.user.id,
    name: session.user.name,
    avatarUrl: session.user.avatarUrl ?? null,
  })

  const limits = getPlayerLimits(room.gameType)

  return {
    room: {
      code: room.code,
      gameType: room.gameType,
      status: room.status,
      playerCount: room.players.length,
      limits,
      waiting: room.players.find((p) => p.userId === session.user.id)?.waiting ?? false,
    },
  }
})
