import { deleteMarketplaceListing } from '../../../../utils/marketplace'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  await deleteMarketplaceListing(id, session.user.id, session.user.role)
  return { ok: true }
})
