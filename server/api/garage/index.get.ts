export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const overview = await getGarageOverview(session.user.id)
  return overview
})
