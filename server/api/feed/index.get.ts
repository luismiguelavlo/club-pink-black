export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const [posts, topPilots] = await Promise.all([
    listFeedPosts({
      id: session.user.id,
      role: session.user.role,
    }),
    getTopPilots(),
  ])

  return {
    posts,
    topPilots,
  }
})
