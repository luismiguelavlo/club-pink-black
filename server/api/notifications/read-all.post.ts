export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  await markAllNotificationsRead(session.user.id)
  return { ok: true }
})
