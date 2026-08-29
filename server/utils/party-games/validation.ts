import { z } from 'zod'

export const createPartyRoomSchema = z.object({
  gameType: z.enum(['infiltrado', 'bomba', 'no-piso', 'mentiroso']),
})

export const joinPartyRoomSchema = z.object({
  code: z.string().trim().min(4).max(8),
  gameType: z.enum(['infiltrado', 'bomba', 'no-piso', 'mentiroso']).optional(),
})

export const partyChatMessageSchema = z.object({
  text: z.string().trim().min(1).max(300),
})

export const partyGameActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('submit_clue'),
    clue: z.string().trim().min(2).max(40),
  }),
  z.object({
    type: z.literal('vote'),
    targetUserId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('guess_word'),
    word: z.string().trim().min(2).max(40),
  }),
  z.object({
    type: z.literal('pass_bomb'),
    targetUserId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('steal_bomb'),
    targetUserId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('move'),
    direction: z.enum(['left', 'right']),
  }),
  z.object({
    type: z.literal('jump'),
  }),
  z.object({
    type: z.literal('submit_answer'),
    text: z.string().trim().min(1).max(60),
  }),
  z.object({
    type: z.literal('vote_answer'),
    optionId: z.string().trim().min(1),
  }),
])
