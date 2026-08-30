import { listMarketplaceListings } from '../../../utils/marketplace'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)
  const mine = query.mine === '1' || query.mine === 'true'

  const listings = await listMarketplaceListings(session.user.id, {
    mine,
    status: mine ? undefined : 'active',
  })

  return { listings }
})
