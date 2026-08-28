export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  await assertVehicleOwnership(id, session.user.id)
  const stats = await getVehicleStats(id)
  return { stats }
})
