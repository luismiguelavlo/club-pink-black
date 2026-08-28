export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const isAdmin = session.user.role === 'admin'

  const [events, stats, drafts] = await Promise.all([
    listEvents({ includeDrafts: isAdmin, viewerId: session.user.id }),
    getEventStats(),
    isAdmin ? listDraftEvents() : Promise.resolve([]),
  ])

  return {
    events,
    stats,
    drafts,
    canManage: isAdmin,
  }
})
