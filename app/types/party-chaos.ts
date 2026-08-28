export type ChallengeCategory =
  | 'funny'
  | 'mental'
  | 'acting'
  | 'speed'
  | 'memory'
  | 'absurd'
  | 'precision'
  | 'group'
  | 'betrayal'

export type LocalGameId = 'reto-o-pierdes' | 'no-te-rias' | 'cerebro-grupo' | 'party-chaos'

export type NoTeRiasMode = 'normal' | 'silence' | 'character' | 'forbidden'

export type CerebroRoundType = 'memory' | 'speed' | 'lie' | 'challenge' | 'betrayal'

export interface PartyChaosPlayer {
  id: string
  name: string
  points: number
  lives: number
  streak: number
}

export interface PartyChaosConfig {
  startingLives: number
  totalRounds: number
  categories: ChallengeCategory[]
  noTeRiasModes: NoTeRiasMode[]
}

export interface Challenge {
  id: string
  category: ChallengeCategory
  text: string
  seconds: number
}

export const CATEGORY_META: Record<
  ChallengeCategory,
  { label: string; emoji: string }
> = {
  funny: { label: 'Graciosos', emoji: '😂' },
  mental: { label: 'Mentales', emoji: '🧠' },
  acting: { label: 'Actuación', emoji: '🎭' },
  speed: { label: 'Velocidad', emoji: '⚡' },
  memory: { label: 'Memoria', emoji: '👀' },
  absurd: { label: 'Absurdos', emoji: '🤪' },
  precision: { label: 'Precisión', emoji: '🎯' },
  group: { label: 'Grupo', emoji: '👥' },
  betrayal: { label: 'Traición', emoji: '😈' },
}

export const DEFAULT_CONFIG: PartyChaosConfig = {
  startingLives: 3,
  totalRounds: 10,
  categories: ['funny', 'mental', 'acting', 'speed', 'memory', 'absurd', 'precision', 'group', 'betrayal'],
  noTeRiasModes: ['normal', 'silence', 'character', 'forbidden'],
}
