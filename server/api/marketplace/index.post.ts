import { createMarketplaceListingFromForm } from '../../../utils/marketplace'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const form = await readMultipartFormData(event)

  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de publicación requeridos' })
  }

  const listing = await createMarketplaceListingFromForm(session.user.id, form)
  return { listing }
})
