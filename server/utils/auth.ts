import { and, count, desc, eq, ne } from 'drizzle-orm'
import { users, type User, type UserRole } from '../database/schema'
import { useDb } from './db'
import { createNotification } from './notifications'

export type PublicUser = {
  id: string
  email: string
  name: string
  role: UserRole
  motorcycle?: string | null
  avatarUrl?: string | null
  isActive: boolean
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    motorcycle: user.motorcycle,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
  return user
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user
}

export async function listUsers(): Promise<PublicUser[]> {
  const db = useDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      motorcycle: users.motorcycle,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return rows
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  role: UserRole
  motorcycle?: string
  isActive?: boolean
}): Promise<PublicUser> {
  const db = useDb()
  const passwordHash = await hashPassword(input.password)

  const [created] = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      name: input.name.trim(),
      role: input.role,
      motorcycle: input.motorcycle?.trim() || null,
      isActive: input.isActive ?? true,
    })
    .returning()

  if (!created) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo crear el usuario',
    })
  }

  return toPublicUser(created)
}

export async function updateOwnProfile(
  userId: string,
  input: { name: string; motorcycle?: string; bio?: string; profilePublic?: boolean },
): Promise<PublicUser> {
  const db = useDb()
  const [updated] = await db
    .update(users)
    .set({
      name: input.name.trim(),
      motorcycle: input.motorcycle?.trim() || null,
      bio: input.bio?.trim() || null,
      ...(input.profilePublic !== undefined ? { profilePublic: input.profilePublic } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  return toPublicUser(updated)
}

export async function changeOwnPassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await findUserById(userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const valid = await verifyPassword(user.passwordHash, input.currentPassword)
  if (!valid) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña actual no es correcta' })
  }

  if (input.currentPassword === input.newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La nueva contraseña debe ser diferente a la actual',
    })
  }

  const passwordHash = await hashPassword(input.newPassword)
  const db = useDb()
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

export async function updateAdminUser(
  actorId: string,
  targetId: string,
  input: { role?: UserRole; isActive?: boolean },
): Promise<PublicUser> {
  if (actorId === targetId && input.isActive === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No puedes desactivar tu propia cuenta',
    })
  }

  if (actorId === targetId && input.role === 'user') {
    throw createError({
      statusCode: 400,
      statusMessage: 'No puedes quitarte el rol de administrador',
    })
  }

  const target = await findUserById(targetId)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const wasInactive = !target.isActive
  const nextRole = input.role ?? target.role
  const nextActive = input.isActive ?? target.isActive

  if (target.role === 'admin' && (nextRole !== 'admin' || nextActive === false)) {
    const db = useDb()
    const [row] = await db
      .select({ total: count() })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true), ne(users.id, targetId)))

    if ((row?.total ?? 0) < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Debe quedar al menos un administrador activo',
      })
    }
  }

  const db = useDb()
  const [updated] = await db
    .update(users)
    .set({
      role: nextRole,
      isActive: nextActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetId))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  if (wasInactive && updated.isActive) {
    await createNotification({
      userId: updated.id,
      type: 'system',
      title: 'Cuenta activada',
      body: 'Un administrador activó tu cuenta. Ya puedes iniciar sesión.',
      href: '/login',
    })
  }

  return toPublicUser(updated)
}

export async function resetUserPassword(targetId: string): Promise<{ temporaryPassword: string }> {
  const target = await findUserById(targetId)
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const temporaryPassword = `Pink${Math.floor(100000 + Math.random() * 900000)}!`
  const passwordHash = await hashPassword(temporaryPassword)
  const db = useDb()
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, targetId))

  return { temporaryPassword }
}

export function assertAdmin(user: PublicUser | null | undefined): asserts user is PublicUser {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Se requiere rol administrador' })
  }
}
