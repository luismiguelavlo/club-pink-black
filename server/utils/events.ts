import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import {
  clubEvents,
  eventRsvps,
  type ClubEvent,
  type EventDifficulty,
  type EventStatus,
} from '../database/schema'
import { useDb } from './db'
import { createNotification, notifyAllActiveUsers } from './notifications'

export type PublicClubEvent = {
  id: string
  title: string
  description: string | null
  startsAt: string
  location: string
  difficulty: EventDifficulty
  status: EventStatus
  createdById: string
  createdAt: string
  updatedAt: string
  isUpcoming: boolean
  rsvpCount: number
  joinedByMe: boolean
}

function toPublicEvent(
  event: ClubEvent,
  extras?: { rsvpCount?: number; joinedByMe?: boolean },
): PublicClubEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    location: event.location,
    difficulty: event.difficulty,
    status: event.status,
    createdById: event.createdById,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    isUpcoming: event.startsAt.getTime() >= Date.now() && event.status === 'published',
    rsvpCount: extras?.rsvpCount ?? 0,
    joinedByMe: extras?.joinedByMe ?? false,
  }
}

export function difficultyLabel(difficulty: EventDifficulty) {
  switch (difficulty) {
    case 'beginner':
      return 'Beginner'
    case 'pro':
      return 'Pro'
    case 'hardcore':
      return 'Hardcore'
  }
}

export async function listEvents(options?: {
  includeDrafts?: boolean
  viewerId?: string
}): Promise<PublicClubEvent[]> {
  const db = useDb()
  const rows = options?.includeDrafts
    ? await db.select().from(clubEvents).orderBy(asc(clubEvents.startsAt))
    : await db
        .select()
        .from(clubEvents)
        .where(eq(clubEvents.status, 'published'))
        .orderBy(asc(clubEvents.startsAt))

  if (!rows.length) return []

  const eventIds = rows.map((row) => row.id)

  const [countRows, myRows] = await Promise.all([
    db
      .select({
        eventId: eventRsvps.eventId,
        total: count(),
      })
      .from(eventRsvps)
      .where(inArray(eventRsvps.eventId, eventIds))
      .groupBy(eventRsvps.eventId),
    options?.viewerId
      ? db
          .select({ eventId: eventRsvps.eventId })
          .from(eventRsvps)
          .where(
            and(
              inArray(eventRsvps.eventId, eventIds),
              eq(eventRsvps.userId, options.viewerId),
            ),
          )
      : Promise.resolve([] as Array<{ eventId: string }>),
  ])

  const countMap = new Map(countRows.map((row) => [row.eventId, row.total]))
  const joinedSet = new Set(myRows.map((row) => row.eventId))

  return rows.map((event) =>
    toPublicEvent(event, {
      rsvpCount: countMap.get(event.id) ?? 0,
      joinedByMe: joinedSet.has(event.id),
    }),
  )
}

export async function getEventStats() {
  const db = useDb()
  const rows = await db.select().from(clubEvents)
  const now = Date.now()

  return {
    total: rows.length,
    upcoming: rows.filter(
      (event) => event.status === 'published' && event.startsAt.getTime() >= now,
    ).length,
    drafts: rows.filter((event) => event.status === 'draft').length,
    published: rows.filter((event) => event.status === 'published').length,
  }
}

export async function listDraftEvents(): Promise<PublicClubEvent[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(clubEvents)
    .where(eq(clubEvents.status, 'draft'))
    .orderBy(desc(clubEvents.updatedAt))
    .limit(10)

  return rows.map((event) => toPublicEvent(event))
}

export async function createClubEvent(input: {
  createdById: string
  title: string
  description?: string
  startsAt: Date
  location: string
  difficulty: EventDifficulty
  status: EventStatus
}) {
  const db = useDb()
  const [created] = await db
    .insert(clubEvents)
    .values({
      createdById: input.createdById,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startsAt: input.startsAt,
      location: input.location.trim(),
      difficulty: input.difficulty,
      status: input.status,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear la rodada' })
  }

  if (created.status === 'published') {
    await notifyAllActiveUsers({
      type: 'event',
      title: 'Nueva rodada publicada',
      body: created.title,
      href: '/rides',
      excludeUserId: input.createdById,
    })
  }

  return toPublicEvent(created)
}

export async function updateEvent(
  id: string,
  input: {
    title: string
    description?: string
    startsAt: Date
    location: string
    difficulty: EventDifficulty
    status: EventStatus
  },
) {
  const db = useDb()
  const existing = await getEventById(id)

  const [updated] = await db
    .update(clubEvents)
    .set({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      startsAt: input.startsAt,
      location: input.location.trim(),
      difficulty: input.difficulty,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(clubEvents.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Rodada no encontrada' })
  }

  if (existing && existing.status !== 'published' && updated.status === 'published') {
    await notifyAllActiveUsers({
      type: 'event',
      title: 'Nueva rodada publicada',
      body: updated.title,
      href: '/rides',
      excludeUserId: updated.createdById,
    })
  }

  return toPublicEvent(updated)
}

export async function deleteEvent(id: string) {
  const db = useDb()
  const [deleted] = await db
    .delete(clubEvents)
    .where(eq(clubEvents.id, id))
    .returning({ id: clubEvents.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Rodada no encontrada' })
  }
}

export async function getEventById(id: string) {
  const db = useDb()
  const [event] = await db.select().from(clubEvents).where(eq(clubEvents.id, id)).limit(1)
  return event ? toPublicEvent(event) : null
}

export async function joinEventRsvp(input: {
  eventId: string
  userId: string
  name: string
  email: string
  machine?: string | null
}) {
  const db = useDb()

  const [event] = await db
    .select()
    .from(clubEvents)
    .where(and(eq(clubEvents.id, input.eventId), eq(clubEvents.status, 'published')))
    .limit(1)

  if (!event) {
    throw createError({ statusCode: 404, statusMessage: 'Rodada no encontrada' })
  }

  if (event.startsAt.getTime() < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Esta rodada ya finalizó' })
  }

  const existing = await db
    .select({ id: eventRsvps.id })
    .from(eventRsvps)
    .where(
      and(
        eq(eventRsvps.eventId, input.eventId),
        eq(eventRsvps.userId, input.userId),
      ),
    )
    .limit(1)

  if (existing[0]) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya estás inscrito en esta rodada',
    })
  }

  const emailTaken = await db
    .select({ id: eventRsvps.id })
    .from(eventRsvps)
    .where(
      and(
        eq(eventRsvps.eventId, input.eventId),
        eq(eventRsvps.email, input.email.toLowerCase()),
      ),
    )
    .limit(1)

  if (emailTaken[0]) {
    // Link guest RSVP to member account if same email
    await db
      .update(eventRsvps)
      .set({
        userId: input.userId,
        name: input.name,
        machine: input.machine?.trim() || null,
      })
      .where(eq(eventRsvps.id, emailTaken[0].id))
  }
  else {
    await db.insert(eventRsvps).values({
      eventId: input.eventId,
      userId: input.userId,
      name: input.name,
      email: input.email.toLowerCase(),
      machine: input.machine?.trim() || null,
    })
  }

  if (event.createdById !== input.userId) {
    await createNotification({
      userId: event.createdById,
      type: 'rsvp',
      title: 'Nueva inscripción',
      body: `${input.name} se inscribió a “${event.title}”`,
      href: '/rides',
    })
  }

  return { ok: true as const, eventId: input.eventId }
}

export async function leaveEventRsvp(eventId: string, userId: string) {
  const db = useDb()
  const [deleted] = await db
    .delete(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .returning({ id: eventRsvps.id })

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No tienes inscripción en esta rodada',
    })
  }

  return { ok: true as const }
}
