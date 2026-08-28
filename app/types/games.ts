export type GameCategory = 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'PARTY'
export type GameMode = 'solo' | 'multiplayer' | 'local'

export interface GameGuide {
  summary: string
  steps: string[]
  rules?: string[]
}

export interface Game {
  id: string
  title: string
  category: GameCategory
  color: string
  description: string
  thumbnail?: string
  mode?: GameMode
  emoji?: string
  minPlayers?: number
  maxPlayers?: number
  funRating?: number
  difficulty?: number
  guide?: GameGuide
}

export interface GameScore {
  id: string
  gameId: string
  userId: string
  score: number
  level: number
  createdAt: string
  userName: string
}

export interface GameProps {
  paused: boolean
  skinKey?: string
  onScoreChange: (score: number) => void
  onLevelChange: (level: number) => void
  onLivesChange: (lives: number) => void
  onGameOver: (finalScore: number) => void
}
