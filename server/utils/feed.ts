import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  comments,
  postIgnites,
  postImages,
  posts,
  users,
  type UserRole,
} from '../database/schema'
import { useDb } from './db'
import { deleteCloudinaryImage } from './cloudinary'
import { createNotification } from './notifications'

export type FeedAuthor = {
  id: string
  name: string
  role: UserRole
  motorcycle: string | null
}

export type FeedImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

export type FeedComment = {
  id: string
  body: string
  createdAt: string
  author: FeedAuthor
  canDelete: boolean
}

export type FeedPost = {
  id: string
  body: string
  createdAt: string
  author: FeedAuthor
  images: FeedImage[]
  commentsCount: number
  comments: FeedComment[]
  ignitesCount: number
  ignitedByMe: boolean
  canDelete: boolean
}

function roleLabel(role: UserRole) {
  return role === 'admin' ? 'Administrador' : 'Piloto'
}

function toAuthor(row: {
  id: string
  name: string
  role: UserRole
  motorcycle: string | null
}): FeedAuthor {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    motorcycle: row.motorcycle,
  }
}

export function formatRelativeTime(date: Date | string) {
  const value = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - value.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export { roleLabel }

export async function listFeedPosts(viewer: {
  id: string
  role: UserRole
}): Promise<FeedPost[]> {
  const db = useDb()

  const rows = await db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorRole: users.role,
      authorMotorcycle: users.motorcycle,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(50)

  if (!rows.length) return []

  const postIds = rows.map((row) => row.id)

  const [imageRows, commentRows, commentCounts, igniteCounts, myIgnites] = await Promise.all([
    db
      .select()
      .from(postImages)
      .where(inArray(postImages.postId, postIds))
      .orderBy(asc(postImages.sortOrder)),
    db
      .select({
        id: comments.id,
        postId: comments.postId,
        body: comments.body,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorRole: users.role,
        authorMotorcycle: users.motorcycle,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(inArray(comments.postId, postIds))
      .orderBy(asc(comments.createdAt)),
    db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(comments)
      .where(inArray(comments.postId, postIds))
      .groupBy(comments.postId),
    db
      .select({
        postId: postIgnites.postId,
        count: sql<number>`count(*)::int`,
      })
      .from(postIgnites)
      .where(inArray(postIgnites.postId, postIds))
      .groupBy(postIgnites.postId),
    db
      .select({ postId: postIgnites.postId })
      .from(postIgnites)
      .where(and(inArray(postIgnites.postId, postIds), eq(postIgnites.userId, viewer.id))),
  ])

  const countMap = new Map(commentCounts.map((row) => [row.postId, row.count]))
  const igniteMap = new Map(igniteCounts.map((row) => [row.postId, row.count]))
  const ignitedSet = new Set(myIgnites.map((row) => row.postId))
  const imagesByPost = new Map<string, FeedImage[]>()
  const commentsByPost = new Map<string, FeedComment[]>()

  for (const image of imageRows) {
    const list = imagesByPost.get(image.postId) ?? []
    list.push({
      id: image.id,
      imageUrl: image.imageUrl,
      sortOrder: image.sortOrder,
    })
    imagesByPost.set(image.postId, list)
  }

  for (const comment of commentRows) {
    const list = commentsByPost.get(comment.postId) ?? []
    list.push({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: toAuthor({
        id: comment.authorId,
        name: comment.authorName,
        role: comment.authorRole,
        motorcycle: comment.authorMotorcycle,
      }),
      canDelete: viewer.role === 'admin' || comment.authorId === viewer.id,
    })
    commentsByPost.set(comment.postId, list)
  }

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: toAuthor({
      id: row.authorId,
      name: row.authorName,
      role: row.authorRole,
      motorcycle: row.authorMotorcycle,
    }),
    images: imagesByPost.get(row.id) ?? [],
    commentsCount: countMap.get(row.id) ?? 0,
    comments: commentsByPost.get(row.id) ?? [],
    ignitesCount: igniteMap.get(row.id) ?? 0,
    ignitedByMe: ignitedSet.has(row.id),
    canDelete: viewer.role === 'admin' || row.authorId === viewer.id,
  }))
}

export async function getTopPilots(limit = 5) {
  const db = useDb()
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      motorcycle: users.motorcycle,
      postsCount: sql<number>`count(${posts.id})::int`,
    })
    .from(users)
    .leftJoin(posts, eq(posts.authorId, users.id))
    .groupBy(users.id)
    .orderBy(desc(sql`count(${posts.id})`), asc(users.name))
    .limit(limit)

  return rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    motorcycle: row.motorcycle,
    postsCount: row.postsCount,
    rank: index + 1,
  }))
}

export async function createPost(input: {
  authorId: string
  body: string
}) {
  const body = input.body.trim()
  if (body.length < 1) {
    throw createError({ statusCode: 400, statusMessage: 'La descripción es requerida' })
  }
  if (body.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'La descripción es demasiado larga' })
  }

  const db = useDb()
  const [created] = await db
    .insert(posts)
    .values({
      authorId: input.authorId,
      body,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear la publicación' })
  }

  return created.id
}

export async function deletePost(input: {
  postId: string
  viewerId: string
  viewerRole: UserRole
}) {
  const db = useDb()
  const [post] = await db.select().from(posts).where(eq(posts.id, input.postId)).limit(1)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }

  if (input.viewerRole !== 'admin' && post.authorId !== input.viewerId) {
    throw createError({ statusCode: 403, statusMessage: 'No puedes eliminar esta publicación' })
  }

  const images = await db.select().from(postImages).where(eq(postImages.postId, post.id))
  for (const image of images) {
    try {
      await deleteCloudinaryImage(image.cloudinaryPublicId)
    } catch {
      // continue
    }
  }

  await db.delete(posts).where(eq(posts.id, post.id))
}

export async function createComment(input: {
  postId: string
  authorId: string
  authorName: string
  body: string
}) {
  const body = input.body.trim()
  if (body.length < 1) {
    throw createError({ statusCode: 400, statusMessage: 'El comentario no puede estar vacío' })
  }
  if (body.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'El comentario es demasiado largo' })
  }

  const db = useDb()
  const [post] = await db
    .select({ id: posts.id, authorId: posts.authorId, body: posts.body })
    .from(posts)
    .where(eq(posts.id, input.postId))
    .limit(1)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }

  const [created] = await db
    .insert(comments)
    .values({
      postId: input.postId,
      authorId: input.authorId,
      body,
    })
    .returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear el comentario' })
  }

  if (post.authorId !== input.authorId) {
    await createNotification({
      userId: post.authorId,
      type: 'comment',
      title: 'Nuevo comentario',
      body: `${input.authorName} comentó tu publicación`,
      href: '/feed',
    })
  }

  return created
}

export async function toggleIgnite(input: {
  postId: string
  userId: string
  userName: string
}) {
  const db = useDb()
  const [post] = await db
    .select({ id: posts.id, authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, input.postId))
    .limit(1)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }

  const [existing] = await db
    .select({ id: postIgnites.id })
    .from(postIgnites)
    .where(and(eq(postIgnites.postId, input.postId), eq(postIgnites.userId, input.userId)))
    .limit(1)

  if (existing) {
    await db.delete(postIgnites).where(eq(postIgnites.id, existing.id))
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postIgnites)
      .where(eq(postIgnites.postId, input.postId))

    return {
      ignited: false,
      ignitesCount: countRow?.count ?? 0,
    }
  }

  await db.insert(postIgnites).values({
    postId: input.postId,
    userId: input.userId,
  })

  if (post.authorId !== input.userId) {
    await createNotification({
      userId: post.authorId,
      type: 'ignite',
      title: 'Nuevo ignite',
      body: `${input.userName} encendió tu publicación`,
      href: '/feed',
    })
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postIgnites)
    .where(eq(postIgnites.postId, input.postId))

  return {
    ignited: true,
    ignitesCount: countRow?.count ?? 0,
  }
}

export async function deleteComment(input: {
  commentId: string
  viewerId: string
  viewerRole: UserRole
}) {
  const db = useDb()
  const [comment] = await db.select().from(comments).where(eq(comments.id, input.commentId)).limit(1)

  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'Comentario no encontrado' })
  }

  if (input.viewerRole !== 'admin' && comment.authorId !== input.viewerId) {
    throw createError({ statusCode: 403, statusMessage: 'No puedes eliminar este comentario' })
  }

  await db.delete(comments).where(and(eq(comments.id, comment.id)))
}
