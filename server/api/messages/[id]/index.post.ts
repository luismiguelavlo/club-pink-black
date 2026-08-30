import { sendDirectMessage } from '../../../utils/messages'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const text = body?.body
  if (typeof text !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Mensaje requerido' })
  }

  const message = await sendDirectMessage(id, session.user.id, text)
  return { message }
})
