import { listPublicArchiveMedia } from '../../utils/public-site'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const kindRaw = typeof query.kind === 'string' ? query.kind : 'all'
  const kind =
    kindRaw === 'photo' || kindRaw === 'video' || kindRaw === 'all' ? kindRaw : 'all'

  const limit = Number(query.limit ?? 24)
  const offset = Number(query.offset ?? 0)

  return listPublicArchiveMedia({
    kind,
    limit: Number.isFinite(limit) ? limit : 24,
    offset: Number.isFinite(offset) ? offset : 0,
  })
})
