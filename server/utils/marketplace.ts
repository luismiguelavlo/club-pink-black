import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import {
  marketplaceListingImages,
  marketplaceListings,
  users,
  type MarketplaceListingStatus,
  type UserRole,
} from '../database/schema'
import { useDb } from './db'
import { deleteCloudinaryImage, uploadImageToCloudinary } from './cloudinary'

export const MAX_LISTING_IMAGES = 3
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

export type MarketplaceSeller = {
  id: string
  name: string
  avatarUrl: string | null
  motorcycle: string | null
}

export type MarketplaceImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

export type MarketplaceListingView = {
  id: string
  title: string
  description: string
  priceLabel: string | null
  status: MarketplaceListingStatus
  createdAt: string
  updatedAt: string
  seller: MarketplaceSeller
  images: MarketplaceImage[]
  isMine: boolean
}

function toSeller(row: {
  id: string
  name: string
  avatarUrl: string | null
  motorcycle: string | null
}): MarketplaceSeller {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatarUrl,
    motorcycle: row.motorcycle,
  }
}

async function hydrateListings(
  rows: Array<typeof marketplaceListings.$inferSelect>,
  viewerId: string,
): Promise<MarketplaceListingView[]> {
  if (!rows.length) return []

  const db = useDb()
  const listingIds = rows.map((r) => r.id)
  const sellerIds = [...new Set(rows.map((r) => r.sellerId))]

  const [imageRows, sellerRows] = await Promise.all([
    db
      .select()
      .from(marketplaceListingImages)
      .where(inArray(marketplaceListingImages.listingId, listingIds))
      .orderBy(asc(marketplaceListingImages.sortOrder)),
    db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        motorcycle: users.motorcycle,
      })
      .from(users)
      .where(inArray(users.id, sellerIds)),
  ])

  const sellersById = new Map(sellerRows.map((s) => [s.id, s]))
  const imagesByListing = new Map<string, MarketplaceImage[]>()

  for (const img of imageRows) {
    const list = imagesByListing.get(img.listingId) ?? []
    list.push({ id: img.id, imageUrl: img.imageUrl, sortOrder: img.sortOrder })
    imagesByListing.set(img.listingId, list)
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priceLabel: row.priceLabel,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    seller: toSeller(sellersById.get(row.sellerId)!),
    images: imagesByListing.get(row.id) ?? [],
    isMine: row.sellerId === viewerId,
  }))
}

export async function listMarketplaceListings(viewerId: string, options?: {
  mine?: boolean
  status?: MarketplaceListingStatus
}) {
  const db = useDb()
  const status = options?.status ?? 'active'

  const conditions = options?.mine
    ? [eq(marketplaceListings.sellerId, viewerId)]
    : [eq(marketplaceListings.status, status)]

  const rows = await db
    .select()
    .from(marketplaceListings)
    .where(and(...conditions))
    .orderBy(desc(marketplaceListings.createdAt))
    .limit(100)

  return hydrateListings(rows, viewerId)
}

export async function getMarketplaceListing(listingId: string, viewerId: string) {
  const db = useDb()
  const [row] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }

  const [listing] = await hydrateListings([row], viewerId)
  return listing!
}

export async function assertListingOwnership(listingId: string, userId: string) {
  const db = useDb()
  const [row] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }
  if (row.sellerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'No puedes editar esta publicación' })
  }
  return row
}

function parseImageFiles(form: { name?: string; data?: Buffer; filename?: string; type?: string }[]) {
  return form.filter(
    (part) =>
      part.name === 'images'
      && part.data
      && part.filename
      && ALLOWED_MIME.includes(part.type || ''),
  )
}

export async function createMarketplaceListing(
  sellerId: string,
  input: { title: string; description: string; priceLabel?: string | null },
  files: { buffer: Buffer; filename: string; mimeType: string }[],
) {
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'Agrega al menos una foto' })
  }
  if (files.length > MAX_LISTING_IMAGES) {
    throw createError({ statusCode: 400, statusMessage: `Máximo ${MAX_LISTING_IMAGES} fotos por publicación` })
  }

  for (const file of files) {
    if (file.buffer.length > MAX_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Cada imagen debe pesar menos de 8 MB' })
    }
  }

  const db = useDb()
  const [listing] = await db
    .insert(marketplaceListings)
    .values({
      sellerId,
      title: input.title,
      description: input.description,
      priceLabel: input.priceLabel?.trim() || null,
      status: 'active',
    })
    .returning()

  const folder = `club-pink-black/marketplace/${listing!.id}`

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    const upload = await uploadImageToCloudinary({
      buffer: file.buffer,
      filename: file.filename,
      mimeType: file.mimeType,
      folder,
    })
    await db.insert(marketplaceListingImages).values({
      listingId: listing!.id,
      imageUrl: upload.secure_url,
      cloudinaryPublicId: upload.public_id,
      bytes: upload.bytes,
      sortOrder: i,
    })
  }

  return getMarketplaceListing(listing!.id, sellerId)
}

export async function createMarketplaceListingFromForm(
  sellerId: string,
  form: { name?: string; data?: Buffer; filename?: string; type?: string }[],
) {
  const title = form.find((p) => p.name === 'title')?.data?.toString('utf8').trim()
  const description = form.find((p) => p.name === 'description')?.data?.toString('utf8').trim()
  const priceLabel = form.find((p) => p.name === 'priceLabel')?.data?.toString('utf8').trim()

  if (!title || title.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'El título debe tener al menos 3 caracteres' })
  }
  if (!description || description.length < 10) {
    throw createError({ statusCode: 400, statusMessage: 'La descripción debe tener al menos 10 caracteres' })
  }

  const imageParts = parseImageFiles(form)
  const files = imageParts.map((part) => ({
    buffer: Buffer.from(part.data!),
    filename: part.filename!,
    mimeType: part.type || 'image/jpeg',
  }))

  return createMarketplaceListing(sellerId, { title, description, priceLabel }, files)
}

export async function updateMarketplaceListingStatus(
  listingId: string,
  userId: string,
  status: MarketplaceListingStatus,
) {
  await assertListingOwnership(listingId, userId)
  const db = useDb()
  await db
    .update(marketplaceListings)
    .set({ status, updatedAt: new Date() })
    .where(eq(marketplaceListings.id, listingId))

  return getMarketplaceListing(listingId, userId)
}

export async function deleteMarketplaceListing(listingId: string, userId: string, role: UserRole) {
  const db = useDb()
  const [row] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }
  if (row.sellerId !== userId && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'No puedes eliminar esta publicación' })
  }

  const images = await db
    .select()
    .from(marketplaceListingImages)
    .where(eq(marketplaceListingImages.listingId, listingId))

  for (const img of images) {
    try {
      await deleteCloudinaryImage(img.cloudinaryPublicId)
    } catch { /* noop */ }
  }

  await db.delete(marketplaceListings).where(eq(marketplaceListings.id, listingId))
}
