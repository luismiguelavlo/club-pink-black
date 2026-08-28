import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  socialWorkImages,
  socialWorkPosts,
  socialWorkVideos,
  type SocialWorkPost,
  type SocialWorkStatus,
} from '../database/schema'
import { useDb } from './db'
import { deleteCloudinaryImage, isCloudinaryConfigured, uploadImageToCloudinary } from './cloudinary'
import { parseExternalVideoUrl, resolveVideoThumbnail } from './external-video'

export type SocialWorkImageDto = {
  id: string
  imageUrl: string
  sortOrder: number
}

export type SocialWorkVideoDto = {
  id: string
  youtubeUrl: string
  youtubeId: string
  videoProvider: 'youtube' | 'tiktok'
  thumbnailUrl: string
  title: string | null
  sortOrder: number
}

export type SocialWorkPostDto = {
  id: string
  title: string
  description: string
  status: SocialWorkStatus
  coverImageUrl: string | null
  images: SocialWorkImageDto[]
  videos: SocialWorkVideoDto[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SocialWorkPreview = {
  id: string
  title: string
  description: string
  coverImageUrl: string | null
  imageCount: number
  videoCount: number
  publishedAt: string | null
}

const MAX_IMAGES = 12
const MAX_VIDEOS = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function resolveCoverImage(
  images: SocialWorkImageDto[],
  videos: SocialWorkVideoDto[],
): string | null {
  return images[0]?.imageUrl ?? videos[0]?.thumbnailUrl ?? null
}

function toImageDto(row: typeof socialWorkImages.$inferSelect): SocialWorkImageDto {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
  }
}

function toVideoDto(row: typeof socialWorkVideos.$inferSelect): SocialWorkVideoDto {
  const provider = row.videoProvider ?? 'youtube'
  return {
    id: row.id,
    youtubeUrl: row.youtubeUrl,
    youtubeId: row.youtubeId,
    videoProvider: provider,
    thumbnailUrl: resolveVideoThumbnail(provider, row.youtubeId, row.thumbnailUrl),
    title: row.title,
    sortOrder: row.sortOrder,
  }
}

function toPostDto(
  post: SocialWorkPost,
  images: SocialWorkImageDto[],
  videos: SocialWorkVideoDto[],
): SocialWorkPostDto {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    status: post.status,
    coverImageUrl: resolveCoverImage(images, videos),
    images,
    videos,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

async function loadMediaForPosts(postIds: string[]) {
  const db = useDb()

  if (!postIds.length) {
    return {
      imagesByPost: new Map<string, SocialWorkImageDto[]>(),
      videosByPost: new Map<string, SocialWorkVideoDto[]>(),
    }
  }

  const [imageRows, videoRows] = await Promise.all([
    db
      .select()
      .from(socialWorkImages)
      .where(inArray(socialWorkImages.postId, postIds))
      .orderBy(asc(socialWorkImages.sortOrder)),
    db
      .select()
      .from(socialWorkVideos)
      .where(inArray(socialWorkVideos.postId, postIds))
      .orderBy(asc(socialWorkVideos.sortOrder)),
  ])

  const imagesByPost = new Map<string, SocialWorkImageDto[]>()
  const videosByPost = new Map<string, SocialWorkVideoDto[]>()

  for (const row of imageRows) {
    const list = imagesByPost.get(row.postId) ?? []
    list.push(toImageDto(row))
    imagesByPost.set(row.postId, list)
  }

  for (const row of videoRows) {
    const list = videosByPost.get(row.postId) ?? []
    list.push(toVideoDto(row))
    videosByPost.set(row.postId, list)
  }

  return { imagesByPost, videosByPost }
}

async function getPostById(id: string): Promise<SocialWorkPost | undefined> {
  const db = useDb()
  const [post] = await db.select().from(socialWorkPosts).where(eq(socialWorkPosts.id, id)).limit(1)
  return post
}

async function buildPostDto(post: SocialWorkPost): Promise<SocialWorkPostDto> {
  const { imagesByPost, videosByPost } = await loadMediaForPosts([post.id])
  return toPostDto(
    post,
    imagesByPost.get(post.id) ?? [],
    videosByPost.get(post.id) ?? [],
  )
}

export async function listSocialWorkPosts(options?: {
  status?: SocialWorkStatus | 'all'
  limit?: number
  offset?: number
}): Promise<{ items: SocialWorkPostDto[]; total: number; hasMore: boolean }> {
  const db = useDb()
  const status = options?.status ?? 'all'
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 60)
  const offset = Math.max(options?.offset ?? 0, 0)

  const where = status !== 'all' ? eq(socialWorkPosts.status, status) : undefined

  const [rows, totalRow] = await Promise.all([
    where
      ? db
          .select()
          .from(socialWorkPosts)
          .where(where)
          .orderBy(desc(socialWorkPosts.publishedAt), desc(socialWorkPosts.createdAt))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(socialWorkPosts)
          .orderBy(desc(socialWorkPosts.publishedAt), desc(socialWorkPosts.createdAt))
          .limit(limit)
          .offset(offset),
    where
      ? db.select({ total: count() }).from(socialWorkPosts).where(where)
      : db.select({ total: count() }).from(socialWorkPosts),
  ])

  const total = totalRow[0]?.total ?? 0
  const postIds = rows.map((row) => row.id)
  const { imagesByPost, videosByPost } = await loadMediaForPosts(postIds)

  return {
    items: rows.map((row) =>
      toPostDto(
        row,
        imagesByPost.get(row.id) ?? [],
        videosByPost.get(row.id) ?? [],
      ),
    ),
    total,
    hasMore: offset + rows.length < total,
  }
}

export async function listSocialWorkPreviews(limit = 3): Promise<SocialWorkPreview[]> {
  const db = useDb()
  const rows = await db
    .select()
    .from(socialWorkPosts)
    .where(eq(socialWorkPosts.status, 'published'))
    .orderBy(desc(socialWorkPosts.publishedAt), desc(socialWorkPosts.createdAt))
    .limit(Math.min(Math.max(limit, 1), 12))

  const postIds = rows.map((row) => row.id)
  const { imagesByPost, videosByPost } = await loadMediaForPosts(postIds)

  return rows.map((row) => {
    const images = imagesByPost.get(row.id) ?? []
    const videos = videosByPost.get(row.id) ?? []

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      coverImageUrl: resolveCoverImage(images, videos),
      imageCount: images.length,
      videoCount: videos.length,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }
  })
}

export async function getSocialWorkPost(id: string): Promise<SocialWorkPostDto> {
  const post = await getPostById(id)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }
  return buildPostDto(post)
}

export async function getPublishedSocialWorkPost(id: string): Promise<SocialWorkPostDto> {
  const post = await getPostById(id)
  if (!post || post.status !== 'published') {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }
  return buildPostDto(post)
}

export async function createSocialWorkPost(input: {
  createdById: string
  title: string
  description: string
  status: SocialWorkStatus
}): Promise<SocialWorkPostDto> {
  const db = useDb()
  const now = new Date()

  const [created] = await db
    .insert(socialWorkPosts)
    .values({
      title: input.title,
      description: input.description,
      status: input.status,
      createdById: input.createdById,
      publishedAt: input.status === 'published' ? now : null,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear la labor social' })
  }

  return buildPostDto(created)
}

export async function updateSocialWorkPost(
  id: string,
  input: {
    title: string
    description: string
    status: SocialWorkStatus
  },
): Promise<SocialWorkPostDto> {
  const db = useDb()
  const existing = await getPostById(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const wasPublished = existing.status === 'published'
  const willPublish = input.status === 'published'
  const publishedAt =
    willPublish && !wasPublished
      ? new Date()
      : willPublish
        ? existing.publishedAt
        : null

  const [updated] = await db
    .update(socialWorkPosts)
    .set({
      title: input.title,
      description: input.description,
      status: input.status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(socialWorkPosts.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo actualizar la labor social' })
  }

  return buildPostDto(updated)
}

export async function deleteSocialWorkPost(id: string): Promise<void> {
  const db = useDb()
  const existing = await getPostById(id)

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const images = await db
    .select()
    .from(socialWorkImages)
    .where(eq(socialWorkImages.postId, id))

  for (const image of images) {
    try {
      await deleteCloudinaryImage(image.cloudinaryPublicId)
    } catch {
      // Continue cleanup even if Cloudinary fails
    }
  }

  await db.delete(socialWorkPosts).where(eq(socialWorkPosts.id, id))
}

export async function addSocialWorkImages(
  postId: string,
  files: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
): Promise<SocialWorkPostDto> {
  if (!isCloudinaryConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Cloudinary no está configurado para subir imágenes',
    })
  }

  const post = await getPostById(postId)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const db = useDb()
  const [currentCount] = await db
    .select({ total: count() })
    .from(socialWorkImages)
    .where(eq(socialWorkImages.postId, postId))

  const existingTotal = currentCount?.total ?? 0
  if (existingTotal + files.length > MAX_IMAGES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Máximo ${MAX_IMAGES} fotos por publicación`,
    })
  }

  let sortOrder = existingTotal

  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.mimeType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Solo se permiten imágenes JPG, PNG o WEBP',
      })
    }

    if (file.buffer.byteLength > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cada imagen no puede superar 10MB',
      })
    }

    const upload = await uploadImageToCloudinary({
      buffer: file.buffer,
      filename: file.filename,
      mimeType: file.mimeType,
    })

    await db.insert(socialWorkImages).values({
      postId,
      imageUrl: upload.secure_url,
      cloudinaryPublicId: upload.public_id,
      bytes: upload.bytes,
      sortOrder,
    })

    sortOrder += 1
  }

  return buildPostDto(post)
}

export async function deleteSocialWorkImage(postId: string, imageId: string): Promise<SocialWorkPostDto> {
  const post = await getPostById(postId)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const db = useDb()
  const [image] = await db
    .select()
    .from(socialWorkImages)
    .where(and(eq(socialWorkImages.id, imageId), eq(socialWorkImages.postId, postId)))
    .limit(1)

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada' })
  }

  try {
    await deleteCloudinaryImage(image.cloudinaryPublicId)
  } catch {
    // Continue DB delete
  }

  await db.delete(socialWorkImages).where(eq(socialWorkImages.id, imageId))

  return buildPostDto(post)
}

export async function addSocialWorkVideo(
  postId: string,
  input: { videoUrl: string; title?: string },
): Promise<SocialWorkPostDto> {
  const post = await getPostById(postId)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const parsed = await parseExternalVideoUrl(input.videoUrl)

  const db = useDb()
  const [currentCount] = await db
    .select({ total: count() })
    .from(socialWorkVideos)
    .where(eq(socialWorkVideos.postId, postId))

  if ((currentCount?.total ?? 0) >= MAX_VIDEOS) {
    throw createError({
      statusCode: 400,
      statusMessage: `Máximo ${MAX_VIDEOS} videos por publicación`,
    })
  }

  await db.insert(socialWorkVideos).values({
    postId,
    youtubeUrl: parsed.videoUrl,
    youtubeId: parsed.videoId,
    videoProvider: parsed.provider,
    thumbnailUrl: parsed.thumbnailUrl || null,
    title: input.title?.trim() || null,
    sortOrder: currentCount?.total ?? 0,
  })

  return buildPostDto(post)
}

export async function deleteSocialWorkVideo(postId: string, videoId: string): Promise<SocialWorkPostDto> {
  const post = await getPostById(postId)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Labor social no encontrada' })
  }

  const db = useDb()
  const [video] = await db
    .select()
    .from(socialWorkVideos)
    .where(and(eq(socialWorkVideos.id, videoId), eq(socialWorkVideos.postId, postId)))
    .limit(1)

  if (!video) {
    throw createError({ statusCode: 404, statusMessage: 'Video no encontrado' })
  }

  await db.delete(socialWorkVideos).where(eq(socialWorkVideos.id, videoId))

  return buildPostDto(post)
}

export async function getSocialWorkStats() {
  const db = useDb()
  const [totals] = await db
    .select({
      total: count(),
      published: sql<number>`count(*) filter (where ${socialWorkPosts.status} = 'published')::int`,
      drafts: sql<number>`count(*) filter (where ${socialWorkPosts.status} = 'draft')::int`,
    })
    .from(socialWorkPosts)

  return {
    total: totals?.total ?? 0,
    published: totals?.published ?? 0,
    drafts: totals?.drafts ?? 0,
  }
}
