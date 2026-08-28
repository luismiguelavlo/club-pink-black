import { and, count, desc, eq, isNull, ne } from 'drizzle-orm'
import {
  notifications,
  users,
  type NotificationType,
} from '../database/schema'
import { useDb } from './db'

export type PublicNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  body: string
  href?: string
}) {
  if (!input.userId) return null

  const db = useDb()
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })
    .returning()

  return row
}

export async function notifyUsers(input: {
  userIds: string[]
  type: NotificationType
  title: string
  body: string
  href?: string
  excludeUserId?: string
}) {
  const ids = [...new Set(input.userIds)].filter(
    (id) => id && id !== input.excludeUserId,
  )
  if (!ids.length) return

  const db = useDb()
  await db.insert(notifications).values(
    ids.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })),
  )
}

export async function notifyAllActiveUsers(input: {
  type: NotificationType
  title: string
  body: string
  href?: string
  excludeUserId?: string
}) {
  const db = useDb()
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        input.excludeUserId ? ne(users.id, input.excludeUserId) : undefined,
      ),
    )

  await notifyUsers({
    userIds: rows.map((row) => row.id),
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
  })
}

export async function listNotifications(userId: string, limit = 30) {
  const db = useDb()
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50))

  return rows.map(
    (row): PublicNotification => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }),
  )
}

export async function countUnreadNotifications(userId: string) {
  const db = useDb()
  const [row] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))

  return row?.total ?? 0
}

export async function markNotificationRead(userId: string, id: string) {
  const db = useDb()
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)))
}

export async function markAllNotificationsRead(userId: string) {
  const db = useDb()
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
}

export async function listActiveUserIds(excludeUserId?: string) {
  const db = useDb()
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        excludeUserId ? ne(users.id, excludeUserId) : undefined,
      ),
    )
  return rows.map((row) => row.id)
}
