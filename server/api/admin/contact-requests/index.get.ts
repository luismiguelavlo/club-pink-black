import { assertAdmin } from '../../../utils/auth'
import { listContactRequests } from '../../../utils/public-site'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const requests = await listContactRequests()

  return {
    requests,
    total: requests.length,
  }
})
