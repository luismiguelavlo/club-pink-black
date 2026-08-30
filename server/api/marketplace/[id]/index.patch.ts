import { updateMarketplaceListingStatus } from '../../../../utils/marketplace'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const body = await readBody(event)
  const status = body?.status

  if (status !== 'active' && status !== 'sold' && status !== 'archived') {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }

  const listing = await updateMarketplaceListingStatus(id, session.user.id, status)
  return { listing }
})
