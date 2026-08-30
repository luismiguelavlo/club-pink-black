import { getOrCreateConversation } from '../../../utils/messages'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)
  const otherUserId = body?.otherUserId as string | undefined
  const listingId = body?.listingId as string | undefined

  if (!otherUserId) {
    throw createError({ statusCode: 400, statusMessage: 'otherUserId requerido' })
  }

  const conversation = await getOrCreateConversation({
    userId: session.user.id,
    otherUserId,
    listingId,
  })

  return { conversationId: conversation.id }
})
