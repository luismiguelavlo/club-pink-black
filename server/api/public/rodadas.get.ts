import { listPublicMarketingEvents } from '../../utils/public-site'

export default defineEventHandler(async () => {
  const events = await listPublicMarketingEvents()
  return { events }
})
