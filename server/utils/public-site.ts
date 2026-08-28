import { and, asc, count, desc, eq, isNotNull } from 'drizzle-orm'
import {
  clubEvents,
  contactRequests,
  eventRsvps,
  mediaItems,
  type ClubEvent,
  type EventDifficulty,
  type MediaItem,
  type MediaKind,
} from '../database/schema'
import { useDb } from './db'
import { resolveVideoThumbnail } from './external-video'

export type MarketingEventStatus = 'upcoming' | 'live' | 'past'
export type MarketingEventCategory = 'night-run' | 'meetup' | 'garage' | 'tour'

export type MarketingEvent = {
  id: string
  title: string
  description: string
  dateLabel: string
  timeLabel: string
  location: string
  status: MarketingEventStatus
  category: MarketingEventCategory
  imageUrl: string
  imageAlt: string
  spotsLeft?: number
  featured?: boolean
  rsvpCount: number
  startsAt: string
}

export type PublicArchiveMedia = {
  id: string
  kind: MediaKind
  size: 'standard' | 'tall' | 'large'
  imageUrl: string
  imageAlt: string
  title?: string
  badge?: string
  caption?: string
  duration?: string
  videoLabel?: string
  youtubeUrl?: string | null
}

export type PublicGalleryPreview = {
  id: string
  title: string
  subtitle?: string
  badge?: string
  imageUrl: string
  imageAlt: string
  span: 'wide' | 'narrow'
}

const DEFAULT_EVENT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDVuHht3FM-7knNpUBHtTp4mmBW58NAuL4EKRaPPWFkXbaGcBht3quzAK8Ohhy5TI_OW9Ydj_x2sYTymdI-YrKeeLjECQD1s8jhFtwRpH-k-xmHJYtZRf7ddj54UqamO058UwFxZSGWAHNVl_rep1iTzctu7h8nJpB3J_u6O-I2AcijOkjELYlVLrU4dTaY0uL0ZMgGwRG3VNZuE3NQ5-L9fwbyvUU3ro3wIqNHuQHIpHRKYvSRuAJbTw'

const MASONRY_SIZES: Array<'standard' | 'tall' | 'large'> = [
  'large',
  'standard',
  'tall',
  'standard',
  'standard',
  'tall',
  'standard',
]

function difficultyToCategory(difficulty: EventDifficulty): MarketingEventCategory {
  switch (difficulty) {
    case 'beginner':
      return 'meetup'
    case 'hardcore':
      return 'tour'
    default:
      return 'night-run'
  }
}

function marketingStatus(startsAt: Date, now = Date.now()): MarketingEventStatus {
  const start = startsAt.getTime()
  const liveStart = start - 30 * 60 * 1000
  const liveEnd = start + 3 * 60 * 60 * 1000

  if (now > liveEnd) return 'past'
  if (now >= liveStart && now <= liveEnd) return 'live'
  return 'upcoming'
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase()
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function mediaPreviewUrl(item: MediaItem) {
  if (item.kind === 'video') {
    const provider = item.videoProvider ?? 'youtube'
    if (item.youtubeId) {
      return resolveVideoThumbnail(provider, item.youtubeId, item.thumbnailUrl)
    }
    return item.thumbnailUrl ?? ''
  }
  return item.imageUrl ?? ''
}

function toArchiveMedia(item: MediaItem, index: number): PublicArchiveMedia {
  const preview = mediaPreviewUrl(item)
  const size = MASONRY_SIZES[index % MASONRY_SIZES.length] ?? 'standard'
  const showTitle = item.kind === 'video' || index % 5 === 0

  return {
    id: item.id,
    kind: item.kind,
    size,
    imageUrl: preview,
    imageAlt: item.title,
    title: showTitle ? item.title : undefined,
    badge: index === 0 ? 'DESTACADO' : undefined,
    videoLabel: item.kind === 'video' ? 'Ver video' : undefined,
    youtubeUrl: item.youtubeUrl,
  }
}

function toGalleryPreview(item: MediaItem, index: number): PublicGalleryPreview {
  return {
    id: item.id,
    title: item.title,
    badge: item.kind === 'video' ? 'VIDEO' : undefined,
    imageUrl: mediaPreviewUrl(item),
    imageAlt: item.title,
    span: index % 3 === 0 ? 'wide' : 'narrow',
  }
}

function toMarketingEvent(
  event: ClubEvent,
  rsvpCount: number,
  coverImageUrl: string,
  featured: boolean,
): MarketingEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description?.trim() || 'Rodada del Pink & Black Road Rider Club.',
    dateLabel: formatDateLabel(event.startsAt),
    timeLabel: formatTimeLabel(event.startsAt),
    location: event.location,
    status: marketingStatus(event.startsAt),
    category: difficultyToCategory(event.difficulty),
    imageUrl: coverImageUrl,
    imageAlt: event.title,
    featured,
    rsvpCount,
    startsAt: event.startsAt.toISOString(),
  }
}

export async function listPublicArchiveMedia(options?: {
  kind?: MediaKind | 'all'
  limit?: number
  offset?: number
}) {
  const db = useDb()
  const kind = options?.kind ?? 'all'
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 60)
  const offset = Math.max(options?.offset ?? 0, 0)

  const where =
    kind !== 'all' ? eq(mediaItems.kind, kind) : undefined

  const [rows, totalRow] = await Promise.all([
    where
      ? db
          .select()
          .from(mediaItems)
          .where(where)
          .orderBy(desc(mediaItems.createdAt))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(mediaItems)
          .orderBy(desc(mediaItems.createdAt))
          .limit(limit)
          .offset(offset),
    where
      ? db.select({ total: count() }).from(mediaItems).where(where)
      : db.select({ total: count() }).from(mediaItems),
  ])

  const total = totalRow[0]?.total ?? 0

  return {
    items: rows.map((row, index) => toArchiveMedia(row, offset + index)),
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
  }
}

export async function listPublicGalleryPreview(limit = 4) {
  const db = useDb()
  const rows = await db
    .select()
    .from(mediaItems)
    .orderBy(desc(mediaItems.createdAt))
    .limit(Math.min(Math.max(limit, 1), 12))

  return rows.map((row, index) => toGalleryPreview(row, index))
}

export async function listPublicMarketingEvents(): Promise<MarketingEvent[]> {
  const db = useDb()

  const [events, rsvpRows, coverPhoto] = await Promise.all([
    db
      .select()
      .from(clubEvents)
      .where(eq(clubEvents.status, 'published'))
      .orderBy(asc(clubEvents.startsAt)),
    db
      .select({
        eventId: eventRsvps.eventId,
        total: count(),
      })
      .from(eventRsvps)
      .groupBy(eventRsvps.eventId),
    db
      .select({ imageUrl: mediaItems.imageUrl })
      .from(mediaItems)
      .where(and(eq(mediaItems.kind, 'photo'), isNotNull(mediaItems.imageUrl)))
      .orderBy(desc(mediaItems.createdAt))
      .limit(1),
  ])

  const rsvpMap = new Map(rsvpRows.map((row) => [row.eventId, row.total]))
  const coverImageUrl = coverPhoto[0]?.imageUrl || DEFAULT_EVENT_IMAGE

  const featuredId = events.find(
    (event) => marketingStatus(event.startsAt) !== 'past',
  )?.id

  return events.map((event) =>
    toMarketingEvent(
      event,
      rsvpMap.get(event.id) ?? 0,
      coverImageUrl,
      event.id === featuredId,
    ),
  )
}

export async function createContactRequest(input: {
  name: string
  whatsapp: string
  machine: string
}) {
  const db = useDb()
  const [row] = await db
    .insert(contactRequests)
    .values({
      name: input.name,
      whatsapp: input.whatsapp,
      machine: input.machine,
    })
    .returning()

  return row
}

export async function listContactRequests() {
  const db = useDb()
  const rows = await db
    .select()
    .from(contactRequests)
    .orderBy(desc(contactRequests.createdAt))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    machine: row.machine,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function createEventRsvp(
  eventId: string,
  input: { name: string; email: string; machine?: string },
) {
  const db = useDb()

  const [event] = await db
    .select()
    .from(clubEvents)
    .where(and(eq(clubEvents.id, eventId), eq(clubEvents.status, 'published')))
    .limit(1)

  if (!event) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Rodada no encontrada',
    })
  }

  if (marketingStatus(event.startsAt) === 'past') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Esta rodada ya finalizó',
    })
  }

  const existing = await db
    .select({ id: eventRsvps.id })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.email, input.email)))
    .limit(1)

  if (existing[0]) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya tienes una reserva con este email para esta rodada',
    })
  }

  const [row] = await db
    .insert(eventRsvps)
    .values({
      eventId,
      name: input.name,
      email: input.email,
      machine: input.machine,
    })
    .returning()

  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    email: row.email,
    machine: row.machine,
    createdAt: row.createdAt.toISOString(),
    eventTitle: event.title,
  }
}
