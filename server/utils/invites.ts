import { and, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { invites, users, type Invite, type UserRole } from '../database/schema'
import { useDb } from './db'
import { createUser, findUserByEmail, type PublicUser } from './auth'
import { notifyUsers } from './notifications'

const INVITE_TTL_MS = 24 * 60 * 60 * 1000

export type PublicInvite = {
  id: string
  code: string
  email: string | null
  role: UserRole
  status: Invite['status']
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  inviteUrl: string
}

export type PilotRow = PublicUser & {
  motorcycle: string | null
  createdAt: string
  isActive: boolean
}

export type RecentActivityItem = {
  id: string
  kind: 'joined' | 'invited'
  title: string
  subtitle: string
  createdAt: string
}

function generateInviteCode(): string {
  const segment = Math.floor(1000 + Math.random() * 9000)
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `RIDER-${segment}-${suffix}`
}

function toPublicInvite(invite: Invite, origin: string): PublicInvite {
  return {
    id: invite.id,
    code: invite.code,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    inviteUrl: `${origin}/invite/${invite.code}`,
  }
}

function getRequestOrigin(event: Parameters<typeof getRequestURL>[0]): string {
  const url = getRequestURL(event)
  return url.origin
}

async function markExpiredInvites() {
  const db = useDb()
  await db
    .update(invites)
    .set({ status: 'expired' })
    .where(and(eq(invites.status, 'pending'), lt(invites.expiresAt, new Date())))
}

export async function createInvite(
  event: Parameters<typeof getRequestURL>[0],
  input: {
    createdById: string
    email?: string
    role: UserRole
  },
): Promise<PublicInvite> {
  const db = useDb()
  const email = input.email?.toLowerCase().trim() || null

  if (email) {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Ya existe un usuario con ese email',
      })
    }
  }

  let code = generateInviteCode()
  let availableCode: string | null = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const [collision] = await db
      .select({ id: invites.id })
      .from(invites)
      .where(eq(invites.code, code))
      .limit(1)

    if (!collision) {
      availableCode = code
      break
    }

    code = generateInviteCode()
  }

  if (!availableCode) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo generar un código único. Intenta de nuevo.',
    })
  }

  const [created] = await db
    .insert(invites)
    .values({
      code: availableCode,
      email,
      role: input.role,
      createdById: input.createdById,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning()

  if (!created) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo generar la invitación',
    })
  }

  return toPublicInvite(created, getRequestOrigin(event))
}

export async function listInvites(
  event: Parameters<typeof getRequestURL>[0],
): Promise<PublicInvite[]> {
  await markExpiredInvites()
  const db = useDb()
  const rows = await db.select().from(invites).orderBy(desc(invites.createdAt))
  const origin = getRequestOrigin(event)
  return rows.map((row) => toPublicInvite(row, origin))
}

export async function countPendingInvites(): Promise<number> {
  await markExpiredInvites()
  const db = useDb()
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invites)
    .where(and(eq(invites.status, 'pending'), gt(invites.expiresAt, new Date())))

  return row?.count ?? 0
}

export async function listPilots(): Promise<PilotRow[]> {
  const db = useDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      motorcycle: users.motorcycle,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    motorcycle: row.motorcycle,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getRecentActivity(limit = 6): Promise<RecentActivityItem[]> {
  await markExpiredInvites()
  const db = useDb()

  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)

  const recentInvites = await db
    .select({
      id: invites.id,
      email: invites.email,
      code: invites.code,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .where(eq(invites.status, 'pending'))
    .orderBy(desc(invites.createdAt))
    .limit(limit)

  const joined: RecentActivityItem[] = recentUsers.map((user) => ({
    id: `joined-${user.id}`,
    kind: 'joined',
    title: user.name,
    subtitle: 'Se unió a la hermandad',
    createdAt: user.createdAt.toISOString(),
  }))

  const invited: RecentActivityItem[] = recentInvites.map((invite) => ({
    id: `invited-${invite.id}`,
    kind: 'invited',
    title: 'Invitación enviada',
    subtitle: invite.email ? `A: ${invite.email}` : `Código: ${invite.code}`,
    createdAt: invite.createdAt.toISOString(),
  }))

  return [...joined, ...invited]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export async function revokeInvite(id: string): Promise<void> {
  const db = useDb()
  const [updated] = await db
    .update(invites)
    .set({ status: 'revoked' })
    .where(and(eq(invites.id, id), eq(invites.status, 'pending')))
    .returning({ id: invites.id })

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invitación no encontrada o ya no está pendiente',
    })
  }
}

export async function getInviteByCode(code: string): Promise<Invite | undefined> {
  await markExpiredInvites()
  const db = useDb()
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.code, code.toUpperCase()))
    .limit(1)

  return invite
}

export async function getPublicInvitePreview(code: string) {
  const invite = await getInviteByCode(code)

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invitación no encontrada' })
  }

  if (invite.status === 'accepted') {
    throw createError({ statusCode: 410, statusMessage: 'Esta invitación ya fue utilizada' })
  }

  if (invite.status === 'revoked') {
    throw createError({ statusCode: 410, statusMessage: 'Esta invitación fue revocada' })
  }

  if (invite.status === 'expired' || invite.expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 410, statusMessage: 'Esta invitación ha expirado' })
  }

  return {
    code: invite.code,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
  }
}

export async function acceptInvite(
  event: Parameters<typeof getRequestURL>[0],
  input: {
    code: string
    name: string
    email: string
    password: string
    motorcycle?: string
  },
) {
  const invite = await getInviteByCode(input.code)

  if (!invite) {
    throw createError({ statusCode: 404, statusMessage: 'Invitación no encontrada' })
  }

  if (invite.status !== 'pending' || invite.expiresAt.getTime() < Date.now()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Esta invitación ya no es válida',
    })
  }

  const email = input.email.toLowerCase().trim()

  if (invite.email && invite.email !== email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Debes registrarte con el email de la invitación',
    })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe una cuenta con ese email',
    })
  }

  const user = await createUser({
    email,
    password: input.password,
    name: input.name,
    role: invite.role,
    motorcycle: input.motorcycle,
  })

  const db = useDb()
  await db
    .update(invites)
    .set({
      status: 'accepted',
      acceptedById: user.id,
      acceptedAt: new Date(),
    })
    .where(eq(invites.id, invite.id))

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.isActive, true)))

  await notifyUsers({
    userIds: admins.map((admin) => admin.id),
    type: 'system',
    title: 'Nuevo piloto',
    body: `${user.name} se unió al club.`,
    href: '/admin/pilots',
  })

  if (user.isActive) {
    await setUserSession(event, { user })
  }

  return {
    user,
    pendingApproval: !user.isActive,
  }
}
