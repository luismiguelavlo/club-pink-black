import { assertAdmin } from '../../../utils/auth'
import { countPendingInvites, createInvite, getRecentActivity, listInvites, listPilots } from '../../../utils/invites'
import { createInviteSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const body = await readBody(event)
  const parsed = createInviteSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    })
  }

  const invite = await createInvite(event, {
    createdById: session.user.id,
    email: parsed.data.email,
    role: parsed.data.role,
  })

  return { invite }
})
