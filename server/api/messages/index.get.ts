import { countUnreadMessages, listConversations } from '../../utils/messages'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const [conversations, unreadCount] = await Promise.all([
    listConversations(session.user.id),
    countUnreadMessages(session.user.id),
  ])

  return { conversations, unreadCount }
})
