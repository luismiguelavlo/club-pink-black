import { listClubMembers } from '../../utils/profile'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const members = await listClubMembers()
  return { members }
})
