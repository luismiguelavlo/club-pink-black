import type { PartyRoomState } from '#shared/types/party-games'

const rooms = new Map<string, PartyRoomState>()
const ROOM_TTL_MS = 2 * 60 * 60 * 1000

export function getRoom(code: string): PartyRoomState | undefined {
  const room = rooms.get(code.toUpperCase())
  if (!room) return undefined
  if (Date.now() > room.expiresAt) {
    rooms.delete(code.toUpperCase())
    return undefined
  }
  return room
}

export function saveRoom(room: PartyRoomState): void {
  room.updatedAt = Date.now()
  rooms.set(room.code, room)
}

export function deleteRoom(code: string): void {
  rooms.delete(code.toUpperCase())
}

export function createRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  if (rooms.has(code)) return createRoomCode()
  return code
}

export function newRoomBase(input: {
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
    expiresAt: now + ROOM_TTL_MS,
    bombDisplaySeconds: 12,
    fakeBombHolderIds: [],
    difficultyLevel: 1,
    platforms: [],
  }
}
