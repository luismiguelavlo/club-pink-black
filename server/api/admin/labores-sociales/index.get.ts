import { assertAdmin } from '../../../utils/auth'
import { isCloudinaryConfigured } from '../../../utils/cloudinary'
import { getSocialWorkStats, listSocialWorkPosts } from '../../../utils/social-work'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const [result, stats] = await Promise.all([
    listSocialWorkPosts({ status: 'all', limit: 60 }),
    getSocialWorkStats(),
  ])

  return {
    items: result.items,
    stats,
    cloudinaryConfigured: isCloudinaryConfigured(),
  }
})
