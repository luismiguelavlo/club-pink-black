import { listClubMembers } from '../../utils/profile'

export default defineEventHandler(async () => {
  const members = await listClubMembers()
  return { members }
})
