import { randomUUID } from 'node:crypto'
import type {
  PartyChatMessage,
  PartyGameAction,
  PartyPlayer,
  PartyRoomState,
  PartyRoomView,
} from '#shared/types/party-games'
import { pickRandomWord } from './words'
import { pickRandomMentirosoQuestion } from './mentiroso-questions'
import { saveRoom } from './store'

const CHAT_MAX_MESSAGES = 50

const PLAYER_COLORS = ['#ffb0ca', '#4dd0e1', '#00ff50', '#ffff00', '#ff6b6b', '#c084fc', '#fb923c', '#38bdf8', '#f472b6', '#a3e635']

const INFILTRADO_MIN = 4
const INFILTRADO_MAX = 10

const BOMBA_MIN = 3
const BOMBA_MAX = 10

const NO_PISO_MIN = 2
const NO_PISO_MAX = 8

const MENTIROSO_MIN = 2
const MENTIROSO_MAX = 10
const MENTIROSO_TOTAL_ROUNDS = 6
const MENTIROSO_ANSWER_MS = 45_000
const MENTIROSO_VOTING_MS = 30_000
const MENTIROSO_REVEAL_MS = 9_000
const MENTIROSO_CORRECT_POINTS = 100
const MENTIROSO_TRICK_POINTS = 50

const WORLD_W = 800
const WORLD_H = 600
const LAVA_Y = 560
const PLAYER_W = 28
const PLAYER_H = 36
const GRAVITY = 0.55
const MOVE_SPEED = 6
const JUMP_VELOCITY = -11

export function getPlayerLimits(gameType: PartyRoomState['gameType']) {
  switch (gameType) {
    case 'infiltrado':
      return { min: INFILTRADO_MIN, max: INFILTRADO_MAX }
    case 'bomba':
      return { min: BOMBA_MIN, max: BOMBA_MAX }
    case 'no-piso':
      return { min: NO_PISO_MIN, max: NO_PISO_MAX }
    case 'mentiroso':
      return { min: MENTIROSO_MIN, max: MENTIROSO_MAX }
  }
}

export async function addPlayerToRoom(
  room: PartyRoomState,
  user: { id: string; name: string; avatarUrl: string | null },
): Promise<PartyRoomState> {
  if (room.status !== 'lobby') {
    throw createError({ statusCode: 400, statusMessage: 'La partida ya comenzó' })
  }

  const limits = getPlayerLimits(room.gameType)
  if (room.players.length >= limits.max) {
    throw createError({ statusCode: 400, statusMessage: 'La sala está llena' })
  }

  if (room.players.some((p) => p.userId === user.id)) {
    return room
  }

  const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length]!
  room.players.push({
    userId: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    lives: 3,
    alive: true,
    isHost: false,
    x: 80 + room.players.length * 60,
    y: 400,
    vx: 0,
    vy: 0,
    onGround: true,
    color,
  })

  await saveRoom(room)
  return room
}

export async function removePlayerFromRoom(room: PartyRoomState, userId: string): Promise<PartyRoomState | null> {
  room.players = room.players.filter((p) => p.userId !== userId)

  if (room.players.length === 0) {
    return null
  }

  if (room.hostUserId === userId) {
    const nextHost = room.players[0]!
    nextHost.isHost = true
    room.hostUserId = nextHost.userId
    room.players.forEach((p) => {
      p.isHost = p.userId === nextHost.userId
    })
  }

  if (room.status === 'playing') {
    handlePlayerDisconnect(room, userId)
  }

  await saveRoom(room)
  return room
}

function handlePlayerDisconnect(room: PartyRoomState, userId: string) {
  if (room.gameType === 'bomba' && room.bombHolderId === userId) {
    const alive = room.players.filter((p) => p.alive && p.userId !== userId)
    if (alive.length > 0) {
      room.bombHolderId = alive[Math.floor(Math.random() * alive.length)]!.userId
      armBomb(room)
    }
  }
}

export async function addChatMessage(room: PartyRoomState, userId: string, text: string): Promise<PartyRoomState> {
  const player = room.players.find((p) => p.userId === userId)
  if (!player) {
    throw createError({ statusCode: 403, statusMessage: 'No estás en esta sala' })
  }

  const message: PartyChatMessage = {
    id: randomUUID(),
    userId,
    name: player.name,
    text,
    sentAt: Date.now(),
  }

  room.chatMessages = [...(room.chatMessages ?? []), message].slice(-CHAT_MAX_MESSAGES)
  await saveRoom(room)
  return room
}

export async function startGame(room: PartyRoomState, userId: string): Promise<PartyRoomState> {
  if (room.hostUserId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Solo el anfitrión puede iniciar' })
  }

  if (room.status === 'playing') {
    throw createError({ statusCode: 400, statusMessage: 'La partida ya está en curso' })
  }

  const limits = getPlayerLimits(room.gameType)
  if (room.players.length < limits.min) {
    throw createError({
      statusCode: 400,
      statusMessage: `Se necesitan al menos ${limits.min} jugadores`,
    })
  }

  // Full reset so "play again" from a finished room starts clean, regardless
  // of which game left players dead/frozen/scored from the previous match.
  room.status = 'playing'
  room.round = 1
  room.winnerId = undefined
  room.winnerName = undefined
  room.message = undefined
  room.roundResult = undefined
  room.lastExplosion = undefined

  for (const player of room.players) {
    player.lives = 3
    player.alive = true
    player.clue = undefined
    player.voteTargetId = undefined
    player.guess = undefined
    player.frozenUntil = undefined
    player.shield = undefined
    player.bluffAnswer = undefined
    player.votedOptionId = undefined
    player.points = 0
    player.x = 100
    player.y = 400
    player.vx = 0
    player.vy = 0
    player.onGround = true
  }

  switch (room.gameType) {
    case 'infiltrado':
      startInfiltradoRound(room)
      break
    case 'bomba':
      startBombaRound(room)
      break
    case 'no-piso':
      startNoPisoGame(room)
      break
    case 'mentiroso':
      room.round = 0
      room.mentirosoTotalRounds = MENTIROSO_TOTAL_ROUNDS
      room.mentirosoUsedQuestionIds = []
      startMentirosoRound(room)
      break
  }

  await saveRoom(room)
  return room
}

function startInfiltradoRound(room: PartyRoomState) {
  const word = pickRandomWord()
  const alive = room.players.filter((p) => p.alive)
  const infiltrator = alive[Math.floor(Math.random() * alive.length)]!

  room.secretWord = word
  room.infiltratorId = infiltrator.userId
  room.phase = 'infiltrado_clues'
  room.phaseEndsAt = Date.now() + 90_000
  room.message = 'Escribe una pista relacionada con la palabra secreta'
  room.roundResult = undefined

  for (const player of room.players) {
    player.clue = undefined
    player.voteTargetId = undefined
    player.guess = undefined
  }
}

function startBombaRound(room: PartyRoomState) {
  const alive = room.players.filter((p) => p.alive)
  if (alive.length <= 1) {
    endBombaGame(room, alive[0])
    return
  }

  room.phase = 'bomba_playing'
  room.lastExplosion = undefined
  room.fakeBombHolderIds = []

  const holder = alive[Math.floor(Math.random() * alive.length)]!
  room.bombHolderId = holder.userId
  armBomb(room)

  const level = room.difficultyLevel
  if (level >= 2 && alive.length >= 3) {
    const decoys = alive
      .filter((p) => p.userId !== holder.userId)
      .sort(() => Math.random() - 0.5)
      .slice(0, level >= 4 ? 2 : 1)
      .map((p) => p.userId)
    room.fakeBombHolderIds = decoys
  }

  if (level >= 3) {
    const frozen = alive.find((p) => p.userId !== holder.userId && !p.shield)
    if (frozen) {
      frozen.frozenUntil = Date.now() + 4000
    }
  }

  if (level >= 4) {
    const shielded = alive.find((p) => p.userId !== holder.userId && !p.shield)
    if (shielded) shielded.shield = true
  }

  room.message =
    level === 1
      ? '¡La bomba está en juego! Pásala antes de que explote.'
      : `Ronda ${room.round} — ¡Dificultad ${level}! Bombas falsas, congelados y más...`
}

function armBomb(room: PartyRoomState) {
  const seconds = 8 + Math.floor(Math.random() * 7)
  room.bombExpiresAt = Date.now() + seconds * 1000
  room.bombDisplaySeconds = 12
}

function startNoPisoGame(room: PartyRoomState) {
  room.platforms = generatePlatforms()
  room.phase = 'no_piso_playing'
  room.floorWarningAt = Date.now() + 15_000
  room.floorCollapseAt = undefined
  room.message = '¡Sobrevive saltando entre plataformas!'

  room.players.forEach((player, index) => {
    if (!player.alive) return
    player.x = 120 + (index % 4) * 160
    player.y = 320
    player.vx = 0
    player.vy = 0
    player.onGround = true
  })
}

function generatePlatforms() {
  const platforms = [
    { id: 0, x: 0, y: 520, width: WORLD_W, height: 40, solid: true, warning: false },
    { id: 1, x: 60, y: 420, width: 140, height: 16, solid: true, warning: false },
    { id: 2, x: 280, y: 360, width: 120, height: 16, solid: true, warning: false },
    { id: 3, x: 500, y: 300, width: 140, height: 16, solid: true, warning: false },
    { id: 4, x: 680, y: 380, width: 100, height: 16, solid: true, warning: false },
    { id: 5, x: 200, y: 240, width: 110, height: 16, solid: true, warning: false },
    { id: 6, x: 420, y: 180, width: 130, height: 16, solid: true, warning: false },
    { id: 7, x: 40, y: 160, width: 90, height: 16, solid: true, warning: false },
  ]
  return platforms
}

function startMentirosoRound(room: PartyRoomState) {
  room.round += 1
  const used = room.mentirosoUsedQuestionIds ?? []
  const question = pickRandomMentirosoQuestion(used)
  room.mentirosoUsedQuestionIds = [...used, question.id]

  room.mentirosoQuestionId = question.id
  room.mentirosoPrompt = question.prompt
  room.mentirosoRealAnswer = question.answer
  room.mentirosoOptions = []
  room.phase = 'mentiroso_answer'
  room.phaseEndsAt = Date.now() + MENTIROSO_ANSWER_MS
  room.message = `Ronda ${room.round}/${room.mentirosoTotalRounds ?? MENTIROSO_TOTAL_ROUNDS} — inventa una respuesta creíble`

  for (const player of room.players) {
    player.bluffAnswer = undefined
    player.votedOptionId = undefined
  }
}

function buildMentirosoOptions(room: PartyRoomState) {
  const real = (room.mentirosoRealAnswer ?? '').trim()
  const normalize = (s: string) => s.trim().toLowerCase()

  const options: { id: string; text: string; authorId: string | null }[] = [
    { id: 'real', text: real, authorId: null },
  ]

  for (const player of room.players) {
    const bluff = player.bluffAnswer?.trim()
    if (!bluff) continue
    if (normalize(bluff) === normalize(real)) continue
    options.push({ id: player.userId, text: bluff, authorId: player.userId })
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j]!, options[i]!]
  }

  room.mentirosoOptions = options
}

function advanceToMentirosoVoting(room: PartyRoomState) {
  buildMentirosoOptions(room)
  room.phase = 'mentiroso_voting'
  room.phaseEndsAt = Date.now() + MENTIROSO_VOTING_MS
  room.message = 'Vota cuál crees que es la respuesta real'
}

function resolveMentirosoVoting(room: PartyRoomState) {
  const options = room.mentirosoOptions ?? []
  const realOption = options.find((o) => o.authorId === null)

  for (const player of room.players) {
    if (realOption && player.votedOptionId === realOption.id) {
      player.points = (player.points ?? 0) + MENTIROSO_CORRECT_POINTS
    }
  }

  for (const option of options) {
    if (!option.authorId) continue
    const trickedCount = room.players.filter(
      (p) => p.votedOptionId === option.id && p.userId !== option.authorId,
    ).length
    if (trickedCount === 0) continue
    const author = room.players.find((p) => p.userId === option.authorId)
    if (author) author.points = (author.points ?? 0) + trickedCount * MENTIROSO_TRICK_POINTS
  }

  room.phase = 'mentiroso_reveal'
  room.phaseEndsAt = Date.now() + MENTIROSO_REVEAL_MS
  room.message = `La respuesta real era: ${room.mentirosoRealAnswer}`
}

function finishMentiroso(room: PartyRoomState) {
  const winner = [...room.players].sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0]
  room.status = 'finished'
  room.phase = 'finished'
  room.winnerId = winner?.userId
  room.winnerName = winner?.name
  room.message = winner ? `🏆 ¡${winner.name} es el mejor mentiroso!` : 'Partida terminada.'
}

function tickMentiroso(room: PartyRoomState, now: number) {
  if (room.phase === 'mentiroso_answer' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    advanceToMentirosoVoting(room)
    return
  }

  if (room.phase === 'mentiroso_voting' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    resolveMentirosoVoting(room)
    return
  }

  if (room.phase === 'mentiroso_reveal' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    const total = room.mentirosoTotalRounds ?? MENTIROSO_TOTAL_ROUNDS
    if (room.round >= total) {
      finishMentiroso(room)
    } else {
      startMentirosoRound(room)
    }
  }
}

export async function tickRoom(room: PartyRoomState, now = Date.now()): Promise<PartyRoomState> {
  const delta = Math.min(now - room.lastTickAt, 100)
  room.lastTickAt = now

  if (room.gameType === 'bomba' && room.phase === 'bomba_playing') {
    tickBomba(room, now)
  }

  if (room.gameType === 'bomba' && room.phase === 'bomba_exploded') {
    if (room.phaseEndsAt && now >= room.phaseEndsAt) {
      startBombaRound(room)
    }
  }

  if (room.gameType === 'infiltrado') {
    tickInfiltrado(room, now)
  }

  if (room.gameType === 'no-piso' && room.status === 'playing') {
    tickNoPiso(room, now, delta)
  }

  if (room.gameType === 'mentiroso' && room.status === 'playing') {
    tickMentiroso(room, now)
  }

  room.updatedAt = now
  await saveRoom(room)
  return room
}

function tickInfiltrado(room: PartyRoomState, now: number) {
  if (room.phase === 'infiltrado_clues' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    advanceToVoting(room)
    return
  }

  if (room.phase === 'infiltrado_voting' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    resolveVoting(room)
    return
  }

  if (room.phase === 'infiltrado_reveal' && room.phaseEndsAt && now >= room.phaseEndsAt) {
    room.status = 'finished'
    room.phase = 'finished'
    room.message = 'Partida terminada. Crea una nueva sala para jugar otra vez.'
  }
}

function tickBomba(room: PartyRoomState, now: number) {
  if (!room.bombExpiresAt || room.phase !== 'bomba_playing') return

  if (now >= room.bombExpiresAt) {
    const holder = room.players.find((p) => p.userId === room.bombHolderId)
    if (holder && holder.alive) {
      if (holder.shield) {
        holder.shield = false
        room.message = `${holder.name} usó su escudo 🛡️`
        armBomb(room)
        return
      }

      holder.lives -= 1
      if (holder.lives <= 0) {
        holder.alive = false
        holder.lives = 0
      }

      room.lastExplosion = { playerId: holder.userId, at: now }
      room.phase = 'bomba_exploded'
      room.phaseEndsAt = now + 2500
      room.message = `💥 ¡${holder.name} explotó! Vidas restantes: ${holder.lives}`

      const alive = room.players.filter((p) => p.alive)
      if (alive.length <= 1) {
        endBombaGame(room, alive[0])
      } else {
        room.round += 1
        room.difficultyLevel = Math.min(5, room.difficultyLevel + 1)
      }
    }
  }
}

function endBombaGame(room: PartyRoomState, winner?: PartyPlayer) {
  room.status = 'finished'
  room.phase = 'finished'
  room.winnerId = winner?.userId
  room.winnerName = winner?.name
  room.message = winner
    ? `🏆 ¡${winner.name} es el último en pie!`
    : 'Partida terminada.'
}

function tickNoPiso(room: PartyRoomState, now: number, delta: number) {
  if (room.phase === 'no_piso_warning' && room.floorCollapseAt && now >= room.floorCollapseAt) {
    collapseFloor(room)
    room.phase = 'no_piso_playing'
    room.floorWarningAt = now + 18_000
    room.message = '¡El piso desapareció! Sigue saltando.'
    return
  }

  if (room.phase === 'no_piso_playing' && room.floorWarningAt && now >= room.floorWarningAt) {
    room.phase = 'no_piso_warning'
    room.floorCollapseAt = now + 3000
    room.message = '⚠️ ¡EL PISO DESAPARECERÁ EN 3 SEGUNDOS!'
    const bottom = room.platforms
      .filter((p) => p.solid)
      .sort((a, b) => b.y - a.y)[0]
    if (bottom) bottom.warning = true
    return
  }

  simulateNoPisoPhysics(room, delta)

  const alive = room.players.filter((p) => p.alive)
  if (alive.length <= 1 && room.players.filter((p) => p.lives > 0 || p.alive).length > 1) {
    const winner = alive[0]
    room.status = 'finished'
    room.phase = 'finished'
    room.winnerId = winner?.userId
    room.winnerName = winner?.name
    room.message = winner ? `🏆 ¡${winner.name} gana!` : 'Partida terminada.'
  }
}

function collapseFloor(room: PartyRoomState) {
  const solid = room.platforms.filter((p) => p.solid).sort((a, b) => b.y - a.y)
  const target = solid[0]
  if (target) {
    target.solid = false
    target.warning = false
  }
}

function simulateNoPisoPhysics(room: PartyRoomState, delta: number) {
  const factor = delta / 16

  for (const player of room.players) {
    if (!player.alive) continue

    player.vy += GRAVITY * factor
    player.x += player.vx * factor
    player.y += player.vy * factor

    player.x = Math.max(0, Math.min(WORLD_W - PLAYER_W, player.x))

    player.onGround = false
    for (const platform of room.platforms) {
      if (!platform.solid) continue
      if (
        player.x + PLAYER_W > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + PLAYER_H >= platform.y &&
        player.y + PLAYER_H <= platform.y + platform.height + 8 &&
        player.vy >= 0
      ) {
        player.y = platform.y - PLAYER_H
        player.vy = 0
        player.onGround = true
        break
      }
    }

    if (player.y + PLAYER_H >= LAVA_Y) {
      player.alive = false
      player.lives = 0
      room.message = `🔥 ${player.name} cayó al lava`
    }

    player.vx *= 0.85
  }
}

export async function handleAction(
  room: PartyRoomState,
  userId: string,
  action: PartyGameAction,
): Promise<PartyRoomState> {
  await tickRoom(room)

  switch (room.gameType) {
    case 'infiltrado':
      handleInfiltradoAction(room, userId, action)
      break
    case 'bomba':
      handleBombaAction(room, userId, action)
      break
    case 'no-piso':
      handleNoPisoAction(room, userId, action)
      break
    case 'mentiroso':
      handleMentirosoAction(room, userId, action)
      break
  }

  await saveRoom(room)
  return room
}

function handleInfiltradoAction(room: PartyRoomState, userId: string, action: PartyGameAction) {
  const player = room.players.find((p) => p.userId === userId)
  if (!player) {
    throw createError({ statusCode: 403, statusMessage: 'No estás en esta sala' })
  }

  if (action.type === 'submit_clue' && room.phase === 'infiltrado_clues') {
    const clue = action.clue.trim()
    if (clue.length < 2 || clue.length > 40) {
      throw createError({ statusCode: 400, statusMessage: 'La pista debe tener 2-40 caracteres' })
    }
    player.clue = clue
    const alive = room.players.filter((p) => p.alive)
    if (alive.every((p) => p.clue)) {
      advanceToVoting(room)
    }
    return
  }

  if (action.type === 'vote' && room.phase === 'infiltrado_voting') {
    if (!room.players.some((p) => p.userId === action.targetUserId)) {
      throw createError({ statusCode: 400, statusMessage: 'Jugador inválido' })
    }
    if (action.targetUserId === userId) {
      throw createError({ statusCode: 400, statusMessage: 'No puedes votarte a ti mismo' })
    }
    player.voteTargetId = action.targetUserId
    const voters = room.players.filter((p) => p.alive)
    if (voters.every((p) => p.voteTargetId)) {
      resolveVoting(room)
    }
    return
  }

  if (action.type === 'guess_word' && room.phase === 'infiltrado_guess') {
    if (userId !== room.infiltratorId) {
      throw createError({ statusCode: 403, statusMessage: 'Solo el infiltrado puede adivinar' })
    }
    player.guess = action.word.trim().toUpperCase()
    const correct = player.guess === room.secretWord
    room.roundResult = {
      winner: correct ? 'infiltrator' : 'civilians',
      reason: correct
        ? 'El infiltrado adivinó la palabra secreta'
        : 'El infiltrado falló al adivinar',
      correctGuess: correct,
    }
    room.phase = 'infiltrado_reveal'
    room.phaseEndsAt = Date.now() + 8000
    room.message = correct
      ? '🕵️ ¡El infiltrado adivinó la palabra y gana!'
      : '🎉 Los civiles ganan — el infiltrado falló.'
    return
  }

  throw createError({ statusCode: 400, statusMessage: 'Acción no válida en esta fase' })
}

function advanceToVoting(room: PartyRoomState) {
  room.phase = 'infiltrado_voting'
  room.phaseEndsAt = Date.now() + 60_000
  room.message = 'Vota quién crees que es el infiltrado'
}

function resolveVoting(room: PartyRoomState) {
  const votes = new Map<string, number>()
  for (const player of room.players.filter((p) => p.alive && p.voteTargetId)) {
    votes.set(player.voteTargetId!, (votes.get(player.voteTargetId!) ?? 0) + 1)
  }

  let topId = ''
  let topVotes = 0
  for (const [id, count] of votes) {
    if (count > topVotes) {
      topVotes = count
      topId = id
    }
  }

  const caught = topId === room.infiltratorId && topVotes > 0

  if (caught) {
    room.roundResult = {
      winner: 'civilians',
      reason: 'Descubrieron al infiltrado',
      votedPlayerId: topId,
    }
    room.phase = 'infiltrado_reveal'
    room.phaseEndsAt = Date.now() + 8000
    room.message = '🎉 ¡Atraparon al infiltrado! Ganan los civiles.'
  } else {
    room.phase = 'infiltrado_guess'
    room.phaseEndsAt = Date.now() + 45_000
    room.message = 'El infiltrado escapó. Ahora puede adivinar la palabra secreta.'
  }
}

function handleBombaAction(room: PartyRoomState, userId: string, action: PartyGameAction) {
  if (room.phase !== 'bomba_playing') {
    throw createError({ statusCode: 400, statusMessage: 'La bomba no está activa' })
  }

  const player = room.players.find((p) => p.userId === userId)
  if (!player?.alive) {
    throw createError({ statusCode: 403, statusMessage: 'No puedes actuar' })
  }

  if (player.frozenUntil && Date.now() < player.frozenUntil) {
    throw createError({ statusCode: 400, statusMessage: 'Estás congelado 🧊' })
  }

  if (action.type === 'pass_bomb') {
    if (room.bombHolderId !== userId) {
      throw createError({ statusCode: 400, statusMessage: 'No tienes la bomba' })
    }
    passBomb(room, userId, action.targetUserId)
    return
  }

  if (action.type === 'steal_bomb' && room.difficultyLevel >= 5) {
    if (room.bombHolderId === userId) {
      throw createError({ statusCode: 400, statusMessage: 'Ya tienes la bomba' })
    }
    const holder = room.players.find((p) => p.userId === room.bombHolderId)
    if (holder?.shield) {
      holder.shield = false
      room.message = `${holder.name} bloqueó el robo con su escudo`
      return
    }
    room.bombHolderId = userId
    room.message = `${player.name} robó la bomba 💨`
    return
  }

  throw createError({ statusCode: 400, statusMessage: 'Acción no válida' })
}

function passBomb(room: PartyRoomState, fromId: string, toId: string) {
  const target = room.players.find((p) => p.userId === toId)
  if (!target?.alive) {
    throw createError({ statusCode: 400, statusMessage: 'Jugador inválido' })
  }
  if (toId === fromId) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes pasarte la bomba a ti mismo' })
  }
  if (target.frozenUntil && Date.now() < target.frozenUntil) {
    throw createError({ statusCode: 400, statusMessage: 'Ese jugador está congelado' })
  }

  room.bombHolderId = toId
  const from = room.players.find((p) => p.userId === fromId)
  room.message = `${from?.name} pasó la bomba a ${target.name}`
}

function handleNoPisoAction(room: PartyRoomState, userId: string, action: PartyGameAction) {
  if (room.phase !== 'no_piso_playing' && room.phase !== 'no_piso_warning') {
    throw createError({ statusCode: 400, statusMessage: 'La partida no está activa' })
  }

  const player = room.players.find((p) => p.userId === userId)
  if (!player?.alive) {
    throw createError({ statusCode: 403, statusMessage: 'Ya fuiste eliminado' })
  }

  if (action.type === 'move') {
    player.vx = action.direction === 'left' ? -MOVE_SPEED : MOVE_SPEED
    return
  }

  if (action.type === 'jump' && player.onGround) {
    player.vy = JUMP_VELOCITY
    player.onGround = false
    return
  }

  throw createError({ statusCode: 400, statusMessage: 'Acción no válida' })
}

function handleMentirosoAction(room: PartyRoomState, userId: string, action: PartyGameAction) {
  const player = room.players.find((p) => p.userId === userId)
  if (!player) {
    throw createError({ statusCode: 403, statusMessage: 'No estás en esta sala' })
  }

  if (action.type === 'submit_answer' && room.phase === 'mentiroso_answer') {
    if (player.bluffAnswer) {
      throw createError({ statusCode: 400, statusMessage: 'Ya enviaste tu respuesta' })
    }
    player.bluffAnswer = action.text.trim()
    if (room.players.every((p) => p.bluffAnswer)) {
      advanceToMentirosoVoting(room)
    }
    return
  }

  if (action.type === 'vote_answer' && room.phase === 'mentiroso_voting') {
    const option = room.mentirosoOptions?.find((o) => o.id === action.optionId)
    if (!option) {
      throw createError({ statusCode: 400, statusMessage: 'Opción inválida' })
    }
    if (option.authorId === userId) {
      throw createError({ statusCode: 400, statusMessage: 'No puedes votar tu propia respuesta' })
    }
    if (player.votedOptionId) {
      throw createError({ statusCode: 400, statusMessage: 'Ya votaste' })
    }
    player.votedOptionId = action.optionId
    if (room.players.every((p) => p.votedOptionId)) {
      resolveMentirosoVoting(room)
    }
    return
  }

  throw createError({ statusCode: 400, statusMessage: 'Acción no válida en esta fase' })
}

export function toRoomView(room: PartyRoomState, viewerId: string): PartyRoomView {
  const me = room.players.find((p) => p.userId === viewerId)
  const isInfiltrator = room.infiltratorId === viewerId

  let bombSecondsLeft: number | null = null
  let bombUrgent = false

  if (room.gameType === 'bomba' && room.bombHolderId === viewerId && room.bombExpiresAt) {
    bombSecondsLeft = Math.max(0, Math.ceil((room.bombExpiresAt - Date.now()) / 1000))
    bombUrgent = bombSecondsLeft <= 4
  }

  const view: PartyRoomView = {
    code: room.code,
    gameType: room.gameType,
    hostUserId: room.hostUserId,
    status: room.status,
    phase: room.phase,
    round: room.round,
    players: room.players.map((p) => ({ ...p })),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    lastTickAt: room.lastTickAt,
    phaseEndsAt: room.phaseEndsAt,
    message: room.message,
    bombHolderId: room.bombHolderId,
    bombDisplaySeconds: room.bombDisplaySeconds,
    fakeBombHolderIds: room.fakeBombHolderIds,
    difficultyLevel: room.difficultyLevel,
    lastExplosion: room.lastExplosion,
    platforms: room.platforms,
    floorWarningAt: room.floorWarningAt,
    floorCollapseAt: room.floorCollapseAt,
    winnerId: room.winnerId,
    winnerName: room.winnerName,
    roundResult: room.roundResult,
    mentirosoPrompt: room.mentirosoPrompt,
    mentirosoTotalRounds: room.mentirosoTotalRounds,
    chatMessages: room.chatMessages ?? [],
    isInfiltrator,
    bombSecondsLeft,
    bombUrgent,
    me,
  }

  if (room.gameType === 'infiltrado' && room.status === 'playing') {
    if (!isInfiltrator && room.phase !== 'infiltrado_reveal' && room.phase !== 'finished') {
      view.secretWord = room.secretWord
    }
    if (room.phase === 'infiltrado_reveal' || room.phase === 'finished') {
      view.secretWord = room.secretWord
      view.infiltratorId = room.infiltratorId
    }
  }

  if (room.phase === 'infiltrado_reveal' || room.phase === 'finished') {
    view.infiltratorId = room.infiltratorId
  }

  if (room.gameType === 'mentiroso') {
    const revealed = room.phase === 'mentiroso_reveal' || room.phase === 'finished'

    // Hide everyone else's bluff/vote so the reveal isn't spoiled by the raw player list.
    view.players = room.players.map((p) => {
      if (p.userId === viewerId || revealed) return { ...p }
      return { ...p, bluffAnswer: undefined, votedOptionId: undefined }
    })

    if (revealed) {
      view.mentirosoRealAnswer = room.mentirosoRealAnswer
      view.mentirosoOptions = room.mentirosoOptions?.map((o) => ({
        ...o,
        votes: room.players.filter((p) => p.votedOptionId === o.id).length,
        isMine: o.authorId === viewerId,
      }))
    } else {
      view.mentirosoOptions = room.mentirosoOptions?.map((o) => ({
        id: o.id,
        text: o.text,
        isMine: o.authorId === viewerId,
      }))
    }
  }

  return view
}
