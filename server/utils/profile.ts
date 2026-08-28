import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { posts, userGalleryImages, users, type User } from '../database/schema'
import { useDb } from './db'
import {
  deleteCloudinaryImage,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from './cloudinary'

export const MAX_GALLERY_PHOTOS = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export type ProfileGalleryImage = {
  id: string
  imageUrl: string
  sortOrder: number
  createdAt: string
}

export type UserProfile = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
  bio: string | null
  postsCount: number
  galleryCount: number
  memberSince: string
  isOwnProfile: boolean
  isPublic: boolean
  isPrivateView: boolean
  gallery: ProfileGalleryImage[]
}

export type ClubMemberPreview = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
  isPublic: boolean
  postsCount: number
}

function assertImageFile(buffer: Buffer, mimeType: string, filename: string) {
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Formato no permitido. Usa JPG, PNG o WEBP.',
    })
  }

  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La imagen supera el límite de 10 MB.',
    })
  }

  if (!filename.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre de archivo inválido' })
  }
}

async function deleteGalleryImageRecord(image: typeof userGalleryImages.$inferSelect) {
  const db = useDb()

  try {
    await deleteCloudinaryImage(image.cloudinaryPublicId)
  } catch {
    // continue — DB row must still be removed
  }

  await db.delete(userGalleryImages).where(eq(userGalleryImages.id, image.id))
}

export async function getUserProfile(
  userId: string,
  viewerId?: string,
): Promise<UserProfile> {
  const db = useDb()

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user || !user.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Piloto no encontrado' })
  }

  const [postsCountRows, galleryRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(posts)
      .where(eq(posts.authorId, userId)),
    db
      .select()
      .from(userGalleryImages)
      .where(eq(userGalleryImages.userId, userId))
      .orderBy(asc(userGalleryImages.sortOrder), asc(userGalleryImages.createdAt)),
  ])

  const postsCount = postsCountRows[0]?.total ?? 0
  const isOwnProfile = viewerId === userId
  const isPublic = user.profilePublic

  if (!isOwnProfile && !isPublic) {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      motorcycle: null,
      avatarUrl: user.avatarUrl,
      bio: null,
      postsCount: 0,
      galleryCount: 0,
      memberSince: user.createdAt.toISOString(),
      isOwnProfile: false,
      isPublic: false,
      isPrivateView: true,
      gallery: [],
    }
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    motorcycle: user.motorcycle,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    postsCount,
    galleryCount: galleryRows.length,
    memberSince: user.createdAt.toISOString(),
    isOwnProfile,
    isPublic,
    isPrivateView: false,
    gallery: galleryRows.map((row) => ({
      id: row.id,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

export async function assertProfileAccessible(userId: string, viewerId: string) {
  const db = useDb()
  const [user] = await db
    .select({
      id: users.id,
      profilePublic: users.profilePublic,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || !user.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Piloto no encontrado' })
  }

  if (viewerId !== userId && !user.profilePublic) {
    throw createError({ statusCode: 403, statusMessage: 'Este perfil es privado' })
  }
}

export async function listClubMembers(): Promise<ClubMemberPreview[]> {
  const db = useDb()

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      motorcycle: users.motorcycle,
      avatarUrl: users.avatarUrl,
      profilePublic: users.profilePublic,
      postsCount: sql<number>`count(${posts.id})::int`,
    })
    .from(users)
    .leftJoin(posts, eq(posts.authorId, users.id))
    .where(eq(users.isActive, true))
    .groupBy(users.id)
    .orderBy(asc(users.name))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    motorcycle: row.motorcycle,
    avatarUrl: row.avatarUrl,
    isPublic: row.profilePublic,
    postsCount: row.postsCount,
  }))
}

export async function updateOwnBio(userId: string, bio: string | null) {
  const db = useDb()
  const normalized = bio?.trim() || null

  if (normalized && normalized.length > 280) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La bio no puede superar 280 caracteres',
    })
  }

  await db
    .update(users)
    .set({ bio: normalized, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

export async function uploadUserAvatar(
  userId: string,
  file: { buffer: Buffer; filename: string; mimeType: string },
): Promise<User> {
  if (!isCloudinaryConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'El almacenamiento de imágenes no está configurado',
    })
  }

  assertImageFile(file.buffer, file.mimeType, file.filename)

  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const uploaded = await uploadImageToCloudinary({
    buffer: file.buffer,
    filename: file.filename,
    mimeType: file.mimeType,
    folder: `club-pink-black/profiles/${userId}/avatar`,
  })

  if (user.avatarCloudinaryPublicId) {
    try {
      await deleteCloudinaryImage(user.avatarCloudinaryPublicId)
    } catch {
      // continue
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      avatarUrl: uploaded.secure_url,
      avatarCloudinaryPublicId: uploaded.public_id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo actualizar el avatar' })
  }

  return updated
}

async function trimGalleryToLimit(userId: string, keepCount: number) {
  const db = useDb()

  const rows = await db
    .select()
    .from(userGalleryImages)
    .where(eq(userGalleryImages.userId, userId))
    .orderBy(desc(userGalleryImages.createdAt))

  const overflow = rows.slice(keepCount)

  for (const image of overflow) {
    await deleteGalleryImageRecord(image)
  }
}

export async function uploadUserGalleryImage(
  userId: string,
  file: { buffer: Buffer; filename: string; mimeType: string },
): Promise<ProfileGalleryImage[]> {
  if (!isCloudinaryConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'El almacenamiento de imágenes no está configurado',
    })
  }

  assertImageFile(file.buffer, file.mimeType, file.filename)

  const db = useDb()

  const [countRow] = await db
    .select({ total: count() })
    .from(userGalleryImages)
    .where(eq(userGalleryImages.userId, userId))

  const currentCount = countRow?.total ?? 0

  if (currentCount >= MAX_GALLERY_PHOTOS) {
    await trimGalleryToLimit(userId, MAX_GALLERY_PHOTOS - 1)
  }

  const uploaded = await uploadImageToCloudinary({
    buffer: file.buffer,
    filename: file.filename,
    mimeType: file.mimeType,
    folder: `club-pink-black/profiles/${userId}/gallery`,
  })

  const [maxOrder] = await db
    .select({ max: sql<number>`coalesce(max(${userGalleryImages.sortOrder}), -1)` })
    .from(userGalleryImages)
    .where(eq(userGalleryImages.userId, userId))

  await db.insert(userGalleryImages).values({
    userId,
    imageUrl: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    sortOrder: (maxOrder?.max ?? -1) + 1,
    bytes: uploaded.bytes,
  })

  await trimGalleryToLimit(userId, MAX_GALLERY_PHOTOS)

  const profile = await getUserProfile(userId, userId)
  return profile.gallery
}

export async function deleteUserGalleryImage(userId: string, imageId: string) {
  const db = useDb()

  const [image] = await db
    .select()
    .from(userGalleryImages)
    .where(eq(userGalleryImages.id, imageId))
    .limit(1)

  if (!image || image.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada' })
  }

  await deleteGalleryImageRecord(image)
}
