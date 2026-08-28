export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  await assertVehicleOwnership(id, session.user.id)
  const documents = await listDocuments(id)
  return { documents }
})
