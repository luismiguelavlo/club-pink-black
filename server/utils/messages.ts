import { and, asc, count, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm'
import {
  conversations,
  directMessages,
  marketplaceListings,
  users,
} from '../database/schema'
import { useDb } from './db'
import { createNotification } from './notifications'

export type MessagePeer = {
  id: string
  name: string
  avatarUrl: string | null
}

export type ConversationSummary = {
  id: string
  peer: MessagePeer
  listingTitle: string | null
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
}

export type DirectMessageView = {
  id: string
  body: string
  createdAt: string
  readAt: string | null
  senderId: string
  isMine: boolean
}

export type ConversationThread = {
  id: string
  peer: MessagePeer
  listingTitle: string | null
  messages: DirectMessageView[]
}

function sortParticipantIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export async function getOrCreateConversation(input: {
  userId: string
  otherUserId: string
  listingId?: string
}) {
  if (input.userId === input.otherUserId) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes chatear contigo mismo' })
  }

  const db = useDb()
  const [participantAId, participantBId] = sortParticipantIds(input.userId, input.otherUserId)

  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.participantAId, participantAId),
        eq(conversations.participantBId, participantBId),
      ),
    )
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(conversations)
    .values({
      participantAId,
      participantBId,
      listingId: input.listingId ?? null,
    })
    .returning()

  return created!
}

async function getPeer(conversation: typeof conversations.$inferSelect, viewerId: string): Promise<MessagePeer> {
  const peerId = conversation.participantAId === viewerId
    ? conversation.participantBId
    : conversation.participantAId

  const db = useDb()
  const [peer] = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, peerId))
    .limit(1)

  if (!peer) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  return peer
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const db = useDb()

  const rows = await db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.participantAId, userId),
        eq(conversations.participantBId, userId),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50)

  if (!rows.length) return []

  const conversationIds = rows.map((r) => r.id)
  const listingIds = rows.map((r) => r.listingId).filter(Boolean) as string[]

  const [lastMessages, unreadRows, listingRows, peerRows] = await Promise.all([
    db
      .select()
      .from(directMessages)
      .where(inArray(directMessages.conversationId, conversationIds))
      .orderBy(desc(directMessages.createdAt)),
    db
      .select({
        conversationId: directMessages.conversationId,
        unread: count(),
      })
      .from(directMessages)
      .where(
        and(
          inArray(directMessages.conversationId, conversationIds),
          ne(directMessages.senderId, userId),
          isNull(directMessages.readAt),
        ),
      )
      .groupBy(directMessages.conversationId),
    listingIds.length
      ? db
          .select({ id: marketplaceListings.id, title: marketplaceListings.title })
          .from(marketplaceListings)
          .where(inArray(marketplaceListings.id, listingIds))
      : Promise.resolve([]),
    db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(
        inArray(
          users.id,
          rows.flatMap((r) =>
            r.participantAId === userId ? [r.participantBId] : [r.participantAId],
          ),
        ),
      ),
  ])

  const lastByConversation = new Map<string, typeof directMessages.$inferSelect>()
  for (const msg of lastMessages) {
    if (!lastByConversation.has(msg.conversationId)) {
      lastByConversation.set(msg.conversationId, msg)
    }
  }

  const unreadByConversation = new Map(unreadRows.map((r) => [r.conversationId, Number(r.unread)]))
  const listingsById = new Map(listingRows.map((l) => [l.id, l.title]))
  const peersById = new Map(peerRows.map((p) => [p.id, p]))

  return rows.map((row) => {
    const peerId = row.participantAId === userId ? row.participantBId : row.participantAId
    const peer = peersById.get(peerId)!
    const last = lastByConversation.get(row.id)

    return {
      id: row.id,
      peer: {
        id: peer.id,
        name: peer.name,
        avatarUrl: peer.avatarUrl,
      },
      listingTitle: row.listingId ? listingsById.get(row.listingId) ?? null : null,
      lastMessage: last?.body ?? null,
      lastMessageAt: row.lastMessageAt.toISOString(),
      unreadCount: unreadByConversation.get(row.id) ?? 0,
    }
  })
}

export async function assertConversationParticipant(conversationId: string, userId: string) {
  const db = useDb()
  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Conversación no encontrada' })
  }
  if (row.participantAId !== userId && row.participantBId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes acceso a esta conversación' })
  }

  return row
}

export async function getConversationThread(conversationId: string, userId: string): Promise<ConversationThread> {
  const conversation = await assertConversationParticipant(conversationId, userId)
  const db = useDb()

  const [messages, listingRow] = await Promise.all([
    db
      .select()
      .from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(asc(directMessages.createdAt))
      .limit(200),
    conversation.listingId
      ? db
          .select({ title: marketplaceListings.title })
          .from(marketplaceListings)
          .where(eq(marketplaceListings.id, conversation.listingId))
          .limit(1)
      : Promise.resolve([]),
  ])

  await db
    .update(directMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(directMessages.conversationId, conversationId),
        ne(directMessages.senderId, userId),
        isNull(directMessages.readAt),
      ),
    )

  const peer = await getPeer(conversation, userId)

  return {
    id: conversation.id,
    peer,
    listingTitle: listingRow[0]?.title ?? null,
    messages: messages.map((msg) => ({
      id: msg.id,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt?.toISOString() ?? null,
      senderId: msg.senderId,
      isMine: msg.senderId === userId,
    })),
  }
}

export async function sendDirectMessage(conversationId: string, senderId: string, body: string) {
  const conversation = await assertConversationParticipant(conversationId, senderId)
  const trimmed = body.trim()

  if (trimmed.length < 1 || trimmed.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'El mensaje debe tener entre 1 y 1000 caracteres' })
  }

  const db = useDb()
  const now = new Date()

  const [message] = await db
    .insert(directMessages)
    .values({
      conversationId,
      senderId,
      body: trimmed,
    })
    .returning()

  await db
    .update(conversations)
    .set({ lastMessageAt: now })
    .where(eq(conversations.id, conversationId))

  const recipientId = conversation.participantAId === senderId
    ? conversation.participantBId
    : conversation.participantAId

  const [sender] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, senderId))
    .limit(1)

  await createNotification({
    userId: recipientId,
    type: 'message',
    title: `Mensaje de ${sender?.name ?? 'un piloto'}`,
    body: trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed,
    href: `/messages/${conversationId}`,
  })

  return {
    id: message!.id,
    body: message!.body,
    createdAt: message!.createdAt.toISOString(),
    readAt: null,
    senderId,
    isMine: true,
  } satisfies DirectMessageView
}

export async function startConversationFromListing(listingId: string, buyerId: string) {
  const db = useDb()
  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1)

  if (!listing) {
    throw createError({ statusCode: 404, statusMessage: 'Publicación no encontrada' })
  }
  if (listing.sellerId === buyerId) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes contactarte a ti mismo' })
  }

  const conversation = await getOrCreateConversation({
    userId: buyerId,
    otherUserId: listing.sellerId,
    listingId,
  })

  return conversation
}

export async function countUnreadMessages(userId: string) {
  const db = useDb()
  const [row] = await db
    .select({ total: count() })
    .from(directMessages)
    .innerJoin(conversations, eq(directMessages.conversationId, conversations.id))
    .where(
      and(
        or(
          eq(conversations.participantAId, userId),
          eq(conversations.participantBId, userId),
        ),
        ne(directMessages.senderId, userId),
        isNull(directMessages.readAt),
      ),
    )

  return Number(row?.total ?? 0)
}
