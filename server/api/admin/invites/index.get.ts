import { assertAdmin } from '../../../utils/auth'
import { countPendingInvites, getRecentActivity, listInvites, listPilots } from '../../../utils/invites'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const [invitesList, pendingCount, pilots, activity] = await Promise.all([
    listInvites(event),
    countPendingInvites(),
    listPilots(),
    getRecentActivity(),
  ])

  return {
    invites: invitesList,
    pendingCount,
    membersCount: pilots.length,
    pilots,
    activity,
  }
})
