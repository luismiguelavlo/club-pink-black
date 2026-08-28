export type PartyGameId = 'infiltrado' | 'bomba' | 'no-piso'

export type PartyRoomStatus = 'lobby' | 'playing' | 'finished'

export type PartyRoomPhase =
  | 'lobby'
  | 'infiltrado_clues'
  | 'infiltrado_voting'
  | 'infiltrado_guess'
  | 'infiltrado_reveal'
  | 'bomba_playing'
  | 'bomba_exploded'
  | 'no_piso_warning'
  | 'no_piso_playing'
  | 'finished'

export interface PartyPlayer {
  userId: string
  name: string
  avatarUrl: string | null
  lives: number
  alive: boolean
  isHost: boolean
  clue?: string
  voteTargetId?: string
  guess?: string
  frozenUntil?: number
  shield?: boolean
  x: number
  y: number
  vx: number
  vy: number
  onGround: boolean
  color: string
}

export interface NoPisoPlatform {
  id: number
  x: number
  y: number
  width: number
  height: number
  solid: boolean
  warning: boolean
}

export interface PartyRoomState {
  code: string
  gameType: PartyGameId
  hostUserId: string
  status: PartyRoomStatus
  phase: PartyRoomPhase
  round: number
  players: PartyPlayer[]
  createdAt: number
  updatedAt: number
  lastTickAt: number
  phaseEndsAt?: number
  message?: string
  secretWord?: string
  infiltratorId?: string
  roundResult?: {
    winner: 'civilians' | 'infiltrator'
    reason: string
    votedPlayerId?: string
    correctGuess?: boolean
  }
  bombHolderId?: string
  bombExpiresAt?: number
  bombDisplaySeconds: number
  fakeBombHolderIds: string[]
  difficultyLevel: number
  lastExplosion?: { playerId: string; at: number }
  platforms: NoPisoPlatform[]
  floorWarningAt?: number
  floorCollapseAt?: number
  winnerId?: string
  winnerName?: string
}

export type PartyRoomView = Omit<PartyRoomState, 'secretWord' | 'infiltratorId' | 'bombExpiresAt'> & {
  secretWord?: string
  infiltratorId?: string
  isInfiltrator?: boolean
  bombSecondsLeft?: number | null
  bombUrgent?: boolean
  me?: PartyPlayer
}

export type PartyGameAction =
  | { type: 'submit_clue'; clue: string }
  | { type: 'vote'; targetUserId: string }
  | { type: 'guess_word'; word: string }
  | { type: 'pass_bomb'; targetUserId: string }
  | { type: 'steal_bomb'; targetUserId: string }
  | { type: 'move'; direction: 'left' | 'right' }
  | { type: 'jump' }
