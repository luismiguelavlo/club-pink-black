import { getMarketplaceListing } from '../../../utils/marketplace'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const listing = await getMarketplaceListing(id, session.user.id)
  return { listing }
})
