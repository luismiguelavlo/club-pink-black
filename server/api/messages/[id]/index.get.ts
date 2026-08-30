import { getConversationThread } from '../../../utils/messages'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const thread = await getConversationThread(id, session.user.id)
  return { thread }
})
