import { listSocialWorkPosts } from '../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number(query.limit ?? 24)
  const offset = Number(query.offset ?? 0)

  const result = await listSocialWorkPosts({
    status: 'published',
    limit: Number.isFinite(limit) ? limit : 24,
    offset: Number.isFinite(offset) ? offset : 0,
  })

  return {
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      coverImageUrl: item.coverImageUrl,
      imageCount: item.images.length,
      videoCount: item.videos.length,
      publishedAt: item.publishedAt,
    })),
    total: result.total,
    hasMore: result.hasMore,
  }
})
