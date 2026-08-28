import type { CerebroRoundType } from '~/types/party-chaos'
import { CEREBRO_CHALLENGES, pickRandom } from './challenges'

export interface MemoryRound {
  type: 'memory'
  items: string[]
  question: string
  options: string[]
  correctIndex: number
}

export interface SpeedRound {
  type: 'speed'
  colors: { id: string; emoji: string; label: string }[]
  reverse: boolean
}

export interface LieRound {
  type: 'lie'
  prompt: string
}

export interface ChallengeRound {
  type: 'challenge'
  text: string
  seconds: number
}

export interface BetrayalRound {
  type: 'betrayal'
  mission: string
  secretWord: string
  targetName: string
}

export type CerebroRound = MemoryRound | SpeedRound | LieRound | ChallengeRound | BetrayalRound

const MEMORY_POOL: Omit<MemoryRound, 'type'>[] = [
  {
    items: ['🍎', '🍌', '🚗', '🐶', '🎸', '🏠'],
    question: '¿Cuál estaba en la posición #4?',
    options: ['🚗', '🐶', '🎸', '🏠'],
    correctIndex: 1,
  },
  {
    items: ['⭐', '🌙', '☀️', '🌈', '⚡', '❄️'],
    question: '¿Cuál estaba en la posición #2?',
    options: ['⭐', '🌙', '☀️', '🌈'],
    correctIndex: 1,
  },
  {
    items: ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'],
    question: '¿Cuál estaba en la posición #5?',
    options: ['🟢', '🟡', '🟣', '🟠'],
    correctIndex: 2,
  },
  {
    items: ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼'],
    question: '¿Cuál estaba en la posición #3?',
    options: ['🐱', '🐶', '🐰', '🦊'],
    correctIndex: 2,
  },
]

const SPEED_POOL: Omit<SpeedRound, 'type'>[] = [
  {
    colors: [
      { id: 'r', emoji: '🔴', label: 'Rojo' },
      { id: 'b', emoji: '🔵', label: 'Azul' },
      { id: 'g', emoji: '🟢', label: 'Verde' },
      { id: 'y', emoji: '🟡', label: 'Amarillo' },
    ],
    reverse: true,
  },
  {
    colors: [
      { id: 'p', emoji: '🟣', label: 'Morado' },
      { id: 'o', emoji: '🟠', label: 'Naranja' },
      { id: 'w', emoji: '⚪', label: 'Blanco' },
      { id: 'k', emoji: '⚫', label: 'Negro' },
    ],
    reverse: true,
  },
]

export function buildCerebroRound(
  type: CerebroRoundType,
  playerName: string,
  otherNames: string[],
): CerebroRound {
  switch (type) {
    case 'memory': {
      const base = MEMORY_POOL[Math.floor(Math.random() * MEMORY_POOL.length)]!
      return { type: 'memory', ...base }
    }
    case 'speed': {
      const base = SPEED_POOL[Math.floor(Math.random() * SPEED_POOL.length)]!
      return { type: 'speed', ...base }
    }
    case 'lie':
      return {
        type: 'lie',
        prompt: 'Di 3 cosas que hiciste ayer. Una debe ser mentira.',
      }
    case 'challenge':
      return {
        type: 'challenge',
        text: pickRandom(CEREBRO_CHALLENGES),
        seconds: 5,
      }
    case 'betrayal': {
      const target = otherNames[Math.floor(Math.random() * otherNames.length)] ?? 'alguien'
      const words = ['azul', 'pizza', 'motocicleta', 'café', 'viernes']
      const word = words[Math.floor(Math.random() * words.length)]!
      return {
        type: 'betrayal',
        mission: `Haz que ${target} diga la palabra "${word}" sin que se dé cuenta de que estás intentando conseguirlo.`,
        secretWord: word,
        targetName: target,
      }
    }
  }
}

export const CEREBRO_ROUND_ORDER: CerebroRoundType[] = [
  'memory',
  'speed',
  'lie',
  'challenge',
  'betrayal',
]

export const MIXED_ROUND_TYPES = [
  'reto',
  'no-rias',
  'cerebro-memory',
  'cerebro-speed',
  'cerebro-lie',
  'cerebro-challenge',
  'cerebro-betrayal',
] as const

export type MixedRoundType = (typeof MIXED_ROUND_TYPES)[number]

export function pickMixedRound(roundIndex: number): MixedRoundType {
  return MIXED_ROUND_TYPES[roundIndex % MIXED_ROUND_TYPES.length]!
}
