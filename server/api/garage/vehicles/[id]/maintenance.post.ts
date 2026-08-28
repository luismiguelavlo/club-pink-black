import { createMaintenanceSchema } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  await assertVehicleOwnership(id, session.user.id)

  const body = await readBody(event)
  const parsed = createMaintenanceSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Datos inválidos' })
  }

  const record = await createMaintenanceRecord(id, parsed.data)
  return { record }
})
