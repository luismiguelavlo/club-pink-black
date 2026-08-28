import { eq } from 'drizzle-orm'
import { vehicleExpenses } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const db = useDb()
  const [expense] = await db.select().from(vehicleExpenses).where(eq(vehicleExpenses.id, id))
  if (!expense) throw createError({ statusCode: 404, statusMessage: 'Gasto no encontrado' })

  await assertVehicleOwnership(expense.vehicleId, session.user.id)
  await deleteExpense(id)
  return { ok: true }
})
