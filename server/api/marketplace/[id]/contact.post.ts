import { startConversationFromListing } from '../../../utils/messages'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const listingId = getRouterParam(event, 'id')

  if (!listingId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const conversation = await startConversationFromListing(listingId, session.user.id)
  return { conversationId: conversation.id }
})
