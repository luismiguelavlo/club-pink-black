import { and, desc, eq, sql } from 'drizzle-orm'
import { mediaItems, type MediaItem, type MediaKind, type VideoProvider } from '../database/schema'
import { useDb } from './db'
import { deleteCloudinaryImage, uploadImageToCloudinary } from './cloudinary'
import {
  parseExternalVideoUrl,
  resolveVideoThumbnail,
  youtubeThumbnail,
} from './external-video'

export type PublicMediaItem = {
  id: string
  kind: MediaKind
  title: string
  imageUrl: string | null
  cloudinaryPublicId: string | null
  bytes: number | null
  youtubeUrl: string | null
  youtubeId: string | null
  videoProvider: VideoProvider | null
  thumbnailUrl: string | null
  previewUrl: string
  createdAt: string
  updatedAt: string
}

function toPublicMedia(item: MediaItem): PublicMediaItem {
  const provider = item.videoProvider ?? 'youtube'
  const previewUrl =
    item.kind === 'video'
      ? resolveVideoThumbnail(
          provider,
          item.youtubeId ?? '',
          item.thumbnailUrl,
        )
      : (item.imageUrl ?? '')

  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    imageUrl: item.imageUrl,
    cloudinaryPublicId: item.cloudinaryPublicId,
    bytes: item.bytes,
    youtubeUrl: item.youtubeUrl,
    youtubeId: item.youtubeId,
    videoProvider: item.videoProvider,
    thumbnailUrl: item.thumbnailUrl,
    previewUrl,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function listMedia(filter?: MediaKind | 'all'): Promise<PublicMediaItem[]> {
  const db = useDb()
  const rows =
    filter && filter !== 'all'
      ? await db
          .select()
          .from(mediaItems)
          .where(eq(mediaItems.kind, filter))
          .orderBy(desc(mediaItems.createdAt))
      : await db.select().from(mediaItems).orderBy(desc(mediaItems.createdAt))

  return rows.map(toPublicMedia)
}

export async function getMediaStats() {
  const db = useDb()
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      photos: sql<number>`count(*) filter (where ${mediaItems.kind} = 'photo')::int`,
      videos: sql<number>`count(*) filter (where ${mediaItems.kind} = 'video')::int`,
      bytes: sql<number>`coalesce(sum(${mediaItems.bytes}), 0)::bigint`,
    })
    .from(mediaItems)

  return {
    total: totals?.total ?? 0,
    photos: totals?.photos ?? 0,
    videos: totals?.videos ?? 0,
    bytes: Number(totals?.bytes ?? 0),
  }
}

export async function createPhotoMedia(input: {
  createdById: string
  title: string
  buffer: Buffer
  filename: string
  mimeType: string
}) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(input.mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Solo se permiten imágenes JPG, PNG o WEBP',
    })
  }

  const maxBytes = 10 * 1024 * 1024
  if (input.buffer.byteLength > maxBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La imagen no puede superar 10MB',
    })
  }

  const upload = await uploadImageToCloudinary({
    buffer: input.buffer,
    filename: input.filename,
    mimeType: input.mimeType,
  })

  const db = useDb()
  const [created] = await db
    .insert(mediaItems)
    .values({
      kind: 'photo',
      title: input.title.trim() || upload.original_filename || input.filename,
      imageUrl: upload.secure_url,
      cloudinaryPublicId: upload.public_id,
      bytes: upload.bytes,
      createdById: input.createdById,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la imagen' })
  }

  return toPublicMedia(created)
}

export async function createYoutubeMedia(input: {
  createdById: string
  title: string
  videoUrl: string
}) {
  const parsed = await parseExternalVideoUrl(input.videoUrl)

  const db = useDb()
  const [created] = await db
    .insert(mediaItems)
    .values({
      kind: 'video',
      title: input.title.trim(),
      youtubeUrl: parsed.videoUrl,
      youtubeId: parsed.videoId,
      videoProvider: parsed.provider,
      thumbnailUrl: parsed.thumbnailUrl || null,
      createdById: input.createdById,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar el video' })
  }

  return toPublicMedia(created)
}

export async function updateMedia(
  id: string,
  input: { title: string },
): Promise<PublicMediaItem> {
  const db = useDb()
  const [updated] = await db
    .update(mediaItems)
    .set({
      title: input.title.trim(),
      updatedAt: new Date(),
    })
    .where(eq(mediaItems.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Contenido no encontrado' })
  }

  return toPublicMedia(updated)
}

export async function deleteMedia(id: string): Promise<void> {
  const db = useDb()
  const [existing] = await db.select().from(mediaItems).where(eq(mediaItems.id, id)).limit(1)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Contenido no encontrado' })
  }

  if (existing.kind === 'photo' && existing.cloudinaryPublicId) {
    try {
      await deleteCloudinaryImage(existing.cloudinaryPublicId)
    } catch {
      // Continue deleting DB row even if Cloudinary cleanup fails
    }
  }

  await db.delete(mediaItems).where(and(eq(mediaItems.id, id)))
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
