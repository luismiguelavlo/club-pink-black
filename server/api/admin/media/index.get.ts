export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const query = getQuery(event)
  const kind =
    query.kind === 'photo' || query.kind === 'video' || query.kind === 'all'
      ? query.kind
      : 'all'

  const [items, stats] = await Promise.all([listMedia(kind), getMediaStats()])

  return {
    items,
    stats,
    cloudinaryConfigured: isCloudinaryConfigured(),
  }
})
