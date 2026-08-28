import { getUserProfile } from '../../../../utils/profile'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const profile = await getUserProfile(userId)
  return { profile }
})
