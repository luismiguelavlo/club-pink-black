import { eq } from 'drizzle-orm'
import type { PartyRoomState } from '#shared/types/party-games'
import { useDb } from '../db'
import { partyRooms } from '../../database/schema'

const ROOM_TTL_MS = 2 * 60 * 60 * 1000

export async function getRoom(code: string): Promise<PartyRoomState | undefined> {
  const upper = code.toUpperCase()
  const db = useDb()
  const [row] = await db.select().from(partyRooms).where(eq(partyRooms.code, upper)).limit(1)

  if (!row) return undefined

  if (Date.now() > row.expiresAt.getTime()) {
    await db.delete(partyRooms).where(eq(partyRooms.code, upper))
    return undefined
  }

  return row.state
}

export async function saveRoom(room: PartyRoomState): Promise<void> {
  room.updatedAt = Date.now()
  const db = useDb()
  const expiresAt = new Date(Date.now() + ROOM_TTL_MS)

  await db
    .insert(partyRooms)
    .values({
      code: room.code,
      gameType: room.gameType,
      hostUserId: room.hostUserId,
      state: room,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: partyRooms.code,
      set: { state: room, expiresAt, updatedAt: new Date() },
    })
}

export async function deleteRoom(code: string): Promise<void> {
  const db = useDb()
  await db.delete(partyRooms).where(eq(partyRooms.code, code.toUpperCase()))
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Reserves a fresh room code and persists the initial room row in one shot,
 * retrying on the rare code collision instead of racing a separate
 * "is this code free" check (which two concurrent room creations could both pass).
 */
export async function createRoom(input: {
  gameType: PartyRoomState['gameType']
  hostUserId: string
  hostName: string
  hostAvatarUrl: string | null
}): Promise<PartyRoomState> {
  const db = useDb()
  const now = Date.now()

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode()
    const room = newRoomBase({ ...input, code })

    try {
      await db.insert(partyRooms).values({
        code: room.code,
        gameType: room.gameType,
        hostUserId: room.hostUserId,
        state: room,
        expiresAt: new Date(now + ROOM_TTL_MS),
      })
      return room
    } catch (error: unknown) {
      const isUniqueViolation =
        typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505'
      if (!isUniqueViolation) throw error
    }
  }

  throw createError({ statusCode: 500, statusMessage: 'No se pudo crear la sala, intenta de nuevo' })
}

function newRoomBase(input: {
  code: string
  gameType: PartyRoomState['gameType']
  hostUserId: string
  hostName: string
  hostAvatarUrl: string | null
}): PartyRoomState {
  const now = Date.now()
  return {
    code: input.code,
    gameType: input.gameType,
    hostUserId: input.hostUserId,
    status: 'lobby',
    phase: 'lobby',
    round: 0,
    players: [
      {
        userId: input.hostUserId,
        name: input.hostName,
        avatarUrl: input.hostAvatarUrl,
        lives: 3,
        alive: true,
        isHost: true,
        x: 100,
        y: 400,
        vx: 0,
        vy: 0,
        onGround: true,
        color: '#ffb0ca',
      },
    ],
    createdAt: now,
    updatedAt: now,
    lastTickAt: now,
    bombDisplaySeconds: 12,
    fakeBombHolderIds: [],
    difficultyLevel: 1,
    platforms: [],
  }
}
