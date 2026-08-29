import { partyChatMessageSchema } from '../../../../utils/party-games/validation'
import { getRoom } from '../../../../utils/party-games/store'
import { addChatMessage, toRoomView } from '../../../../utils/party-games/engine'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const code = getRouterParam(event, 'code')?.toUpperCase()
  const body = await readBody(event)
  const parsed = partyChatMessageSchema.safeParse(body)

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Código requerido' })
  }

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Mensaje inválido',
    })
  }

  const room = await getRoom(code)

  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Sala no encontrada' })
  }

  await addChatMessage(room, session.user.id, parsed.data.text)

  return {
    room: toRoomView(room, session.user.id),
  }
})
