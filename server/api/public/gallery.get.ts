import { listPublicGalleryPreview } from '../../utils/public-site'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit ?? 4)

  const items = await listPublicGalleryPreview(Number.isFinite(limit) ? limit : 4)

  return { items }
})
