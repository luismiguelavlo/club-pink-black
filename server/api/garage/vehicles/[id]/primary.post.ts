export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  await assertVehicleOwnership(id, session.user.id)
  await setPrimaryVehicle(id, session.user.id)
  return { ok: true }
})
