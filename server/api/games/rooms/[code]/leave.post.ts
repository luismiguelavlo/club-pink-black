import { deleteRoom, getRoom } from '../../../../utils/party-games/store'
import { removePlayerFromRoom } from '../../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  const room = getRoom(code)

  if (!room) {
    return { ok: true }
  }

  const updated = removePlayerFromRoom(room, session.user.id)

  if (!updated) {
    deleteRoom(code)
  }

  return { ok: true }
})
