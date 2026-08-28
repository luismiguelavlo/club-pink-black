import { createReminderSchema } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const vehicle = await assertVehicleOwnership(id, session.user.id)

  const body = await readBody(event)
  const parsed = createReminderSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
  }

  const reminder = await createReminder(id, parsed.data, vehicle.odometerKm)
  return { reminder }
})
