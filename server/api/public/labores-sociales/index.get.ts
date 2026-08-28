import { listSocialWorkPreviews } from '../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit ?? 3)
  const items = await listSocialWorkPreviews(Number.isFinite(limit) ? limit : 3)
  return { items }
})
