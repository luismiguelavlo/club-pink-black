import { assertAdmin, resetUserPassword } from '../../../../utils/auth'
import { createNotification } from '../../../../utils/notifications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  assertAdmin(session.user)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const result = await resetUserPassword(id)

  await createNotification({
    userId: id,
    type: 'system',
    title: 'Contraseña restablecida',
    body: 'Un administrador restableció tu contraseña. Usa la temporal e inicia sesión para cambiarla.',
    href: '/settings?tab=password',
  })

  return {
    ok: true,
    temporaryPassword: result.temporaryPassword,
    message: 'Contraseña temporal generada. Compártela de forma segura con el piloto.',
  }
})
