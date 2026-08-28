export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const [items, unreadCount] = await Promise.all([
    listNotifications(session.user.id),
    countUnreadNotifications(session.user.id),
  ])

  return { items, unreadCount }
})
