<script setup lang="ts">
const emit = defineEmits<{
  finish: []
}>()

const sounds = usePartySounds()

type Phase = 'intro' | 'playing' | 'eliminated' | 'gameover'
type Side = 'top' | 'bottom' | 'left' | 'right'
type PowerUpType = 'multiball' | 'speed' | 'shield' | 'bomb' | 'slow' | 'magnet' | 'reverse'
type ArenaEvent = 'speed' | 'obstacles' | 'smallPaddles' | 'darkness' | 'electric'

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
}

interface PowerUp {
  id: number
  x: number
  y: number
  type: PowerUpType
}

interface PlayerState {
  side: Side
  name: string
  color: string
  lives: number
  alive: boolean
  paddlePos: number
  shieldUntil: number
  reverseUntil: number
  charge: number
}

const FIELD = 500
const BALL_R = 10
const PADDLE_LEN = 95
const PADDLE_THICK = 14
const MAX_SPEED = 820
const MIN_SPEED = 200
const SERVE_SPEED = 265
const GOAL_PAUSE = 1.1
const ARENA_INTERVAL = 20
const SUDDEN_DEATH = 60
const POWERUP_INTERVAL = 10
const CHARGE_PER_HIT = 25
const SUPER_MULT = 2.2
const MAGNET_DURATION = 5
const REVERSE_DURATION = 5
const PADDLE_SPEED = 400

const PLAYER_META: Record<Side, { name: string; color: string }> = {
  top: { name: 'Jugador 1', color: '#ff4d94' },
  left: { name: 'Jugador 2', color: '#38e0e0' },
  bottom: { name: 'Jugador 3', color: '#facc15' },
  right: { name: 'Jugador 4', color: '#a855f7' },
}

const SIDE_LAYOUT: Record<number, Side[]> = {
  2: ['left', 'right'],
  3: ['top', 'left', 'bottom'],
  4: ['top', 'left', 'bottom', 'right'],
}

const POWERUP_META: Record<PowerUpType, { label: string; emoji: string; color: string }> = {
  multiball: { label: 'Multiball', emoji: '🟢', color: '#4ade80' },
  speed: { label: 'Speed', emoji: '⚡', color: '#fbbf24' },
  shield: { label: 'Shield', emoji: '🛡️', color: '#60a5fa' },
  bomb: { label: 'Bomb', emoji: '💥', color: '#f87171' },
  slow: { label: 'Slow', emoji: '🐌', color: '#a78bfa' },
  magnet: { label: 'Magnet', emoji: '🧲', color: '#f472b6' },
  reverse: { label: 'Reverse', emoji: '↔️', color: '#fb923c' },
}

const ARENA_META: Record<ArenaEvent, { label: string; emoji: string }> = {
  speed: { label: '¡Velocidad x2!', emoji: '🔥' },
  obstacles: { label: 'Obstáculos', emoji: '🌀' },
  smallPaddles: { label: 'Paletas mini', emoji: '🏓' },
  darkness: { label: 'Oscuridad', emoji: '🌑' },
  electric: { label: 'Zonas eléctricas', emoji: '⚡' },
}

const PLAYER_OPTIONS = [2, 3, 4] as const
const LIFE_OPTIONS = [3, 5] as const

const canvasRef = ref<HTMLCanvasElement | null>(null)
const phase = ref<Phase>('intro')
const playerCount = ref<2 | 3 | 4>(2)
const startingLives = ref(3)
const activeSides = ref<Side[]>(['left', 'right'])
const players = ref<PlayerState[]>([])
const balls = ref<Ball[]>([])
const powerUps = ref<PowerUp[]>([])
const obstacles = ref<{ x: number; y: number; r: number }[]>([])
const arenaEvent = ref<ArenaEvent | null>(null)
const arenaBanner = ref('')
const arenaBannerTimer = ref(0)
const matchTime = ref(0)
const nextArenaAt = ref(ARENA_INTERVAL)
const nextPowerUpAt = ref(POWERUP_INTERVAL)
const speedBoostUntil = ref(0)
const slowUntil = ref(0)
const smallPaddlesUntil = ref(0)
const darkUntil = ref(0)
const electricUntil = ref(0)
const magnetTargetSide = ref<Side | null>(null)
const magnetUntil = ref(0)
const lastEliminated = ref<PlayerState | null>(null)
const winner = ref<PlayerState | null>(null)
const goalPause = ref(0)
const stallTimer = ref(0)

const pointerSides = new Map<number, Side>()
const pointerTargets = new Map<Side, number>()
const keys = new Set<string>()

let raf: number | null = null
let lastFrame = 0
let ballId = 0
let powerUpId = 0

const alivePlayers = computed(() => players.value.filter((p) => p.alive))
const paddleLen = computed(() => (smallPaddlesUntil.value > matchTime.value ? PADDLE_LEN * 0.55 : PADDLE_LEN))

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function sideIsGoal(side: Side) {
  return activeSides.value.includes(side) && players.value.some((p) => p.side === side && p.alive)
}

function getPlayer(side: Side) {
  return players.value.find((p) => p.side === side)
}

function buildPlayers() {
  const sides = SIDE_LAYOUT[playerCount.value]
  activeSides.value = sides
  players.value = sides.map((side) => ({
    side,
    name: PLAYER_META[side].name,
    color: PLAYER_META[side].color,
    lives: startingLives.value,
    alive: true,
    paddlePos: FIELD / 2,
    shieldUntil: 0,
    reverseUntil: 0,
    charge: 0,
  }))
}

function resetArenaModifiers() {
  arenaEvent.value = null
  obstacles.value = []
  speedBoostUntil.value = 0
  slowUntil.value = 0
  smallPaddlesUntil.value = 0
  darkUntil.value = 0
  electricUntil.value = 0
  magnetTargetSide.value = null
  magnetUntil.value = 0
  matchTime.value = 0
  nextArenaAt.value = ARENA_INTERVAL
  nextPowerUpAt.value = POWERUP_INTERVAL
}

function spawnBall(angle?: number) {
  const a = angle ?? Math.random() * Math.PI * 2
  const speed = SERVE_SPEED * (0.85 + Math.random() * 0.3)
  balls.value.push({
    id: ++ballId,
    x: FIELD / 2 + (Math.random() - 0.5) * 40,
    y: FIELD / 2 + (Math.random() - 0.5) * 40,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
  })
}

function serveAll() {
  balls.value = []
  spawnBall()
}

function startMatch() {
  buildPlayers()
  resetArenaModifiers()
  powerUps.value = []
  winner.value = null
  lastEliminated.value = null
  goalPause.value = 0
  stallTimer.value = 0
  arenaBanner.value = ''
  serveAll()
  phase.value = 'playing'
  sounds.startRound()
}

function paddleSpan(side: Side) {
  const len = paddleLen.value
  const pos = getPlayer(side)?.paddlePos ?? FIELD / 2
  if (side === 'left' || side === 'right') {
    return { start: pos - len / 2, end: pos + len / 2 }
  }
  return { start: pos - len / 2, end: pos + len / 2 }
}

function paddleBlocks(side: Side, coord: number) {
  const span = paddleSpan(side)
  return coord >= span.start && coord <= span.end
}

function bounceBall(ball: Ball, nx: number, ny: number, boost = 1) {
  const dot = ball.vx * nx + ball.vy * ny
  ball.vx = (ball.vx - 2 * dot * nx) * boost
  ball.vy = (ball.vy - 2 * dot * ny) * boost
  const speed = Math.hypot(ball.vx, ball.vy)
  const min = MIN_SPEED * boost
  if (speed < min) {
    ball.vx = (ball.vx / (speed || 1)) * min
    ball.vy = (ball.vy / (speed || 1)) * min
  }
}

function applySpeedLimits(ball: Ball) {
  let mult = 1
  if (speedBoostUntil.value > matchTime.value) mult *= 1.4
  if (slowUntil.value > matchTime.value) mult *= 0.6
  if (matchTime.value >= SUDDEN_DEATH && alivePlayers.value.length > 1) mult *= 1.18

  const speed = Math.hypot(ball.vx, ball.vy)
  const cap = MAX_SPEED * mult
  const floor = MIN_SPEED * mult

  if (speed > cap) {
    ball.vx = (ball.vx / speed) * cap
    ball.vy = (ball.vy / speed) * cap
  }
  else if (speed > 0 && speed < floor) {
    ball.vx = (ball.vx / speed) * floor
    ball.vy = (ball.vy / speed) * floor
  }
}

function getPaddleCenter(side: Side) {
  const player = getPlayer(side)
  if (!player) return { x: FIELD / 2, y: FIELD / 2 }

  if (side === 'left') return { x: PADDLE_THICK + BALL_R, y: player.paddlePos }
  if (side === 'right') return { x: FIELD - PADDLE_THICK - BALL_R, y: player.paddlePos }
  if (side === 'top') return { x: player.paddlePos, y: PADDLE_THICK + BALL_R }
  return { x: player.paddlePos, y: FIELD - PADDLE_THICK - BALL_R }
}

function applyMagnetForce(ball: Ball, dt: number) {
  if (magnetUntil.value <= matchTime.value || !magnetTargetSide.value) return

  const target = getPaddleCenter(magnetTargetSide.value)
  const dx = target.x - ball.x
  const dy = target.y - ball.y
  const dist = Math.hypot(dx, dy) || 1
  const pull = clamp(1 - dist / (FIELD * 0.75), 0.15, 1) * 380 * dt

  ball.vx += (dx / dist) * pull
  ball.vy += (dy / dist) * pull
}

function pickOpponentSide(collector?: Side): Side | null {
  const pool = players.value.filter((p) => p.alive && p.side !== collector)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]!.side
}

function isReversed(player: PlayerState) {
  return player.reverseUntil > matchTime.value
}

function mirrorPaddlePos(player: PlayerState, pos: number) {
  if (!isReversed(player)) return pos
  return FIELD - pos
}

function collidePaddle(ball: Ball, side: Side) {
  const player = getPlayer(side)
  if (!player?.alive) return false

  const len = paddleLen.value
  const pos = player.paddlePos
  let hit = false
  let nx = 0
  let ny = 0
  let offset = 0

  if (side === 'left') {
    if (ball.x - BALL_R > PADDLE_THICK) return false
    if (!paddleBlocks(side, ball.y)) return false
    ball.x = PADDLE_THICK + BALL_R
    nx = 1
    ny = 0
    offset = (ball.y - pos) / (len / 2)
    hit = true
  }
  else if (side === 'right') {
    if (ball.x + BALL_R < FIELD - PADDLE_THICK) return false
    if (!paddleBlocks(side, ball.y)) return false
    ball.x = FIELD - PADDLE_THICK - BALL_R
    nx = -1
    ny = 0
    offset = (ball.y - pos) / (len / 2)
    hit = true
  }
  else if (side === 'top') {
    if (ball.y - BALL_R > PADDLE_THICK) return false
    if (!paddleBlocks(side, ball.x)) return false
    ball.y = PADDLE_THICK + BALL_R
    nx = 0
    ny = 1
    offset = (ball.x - pos) / (len / 2)
    hit = true
  }
  else if (side === 'bottom') {
    if (ball.y + BALL_R < FIELD - PADDLE_THICK) return false
    if (!paddleBlocks(side, ball.x)) return false
    ball.y = FIELD - PADDLE_THICK - BALL_R
    nx = 0
    ny = -1
    offset = (ball.x - pos) / (len / 2)
    hit = true
  }

  if (!hit) return false

  const perfect = Math.abs(offset) < 0.18
  let boost = 1.08 + Math.abs(offset) * 0.35

  if (perfect) {
    player.charge = clamp(player.charge + CHARGE_PER_HIT, 0, 100)
  }

  if (player.charge >= 100) {
    player.charge = 0
    boost = SUPER_MULT
    sounds.success()
  }

  ball.vx += offset * 180
  ball.vy += offset * 180
  bounceBall(ball, nx, ny, boost)
  sounds.tick()
  return true
}

function collideObstacles(ball: Ball) {
  for (const obs of obstacles.value) {
    const dx = ball.x - obs.x
    const dy = ball.y - obs.y
    const dist = Math.hypot(dx, dy)
    const minDist = BALL_R + obs.r
    if (dist >= minDist) continue

    const nx = dist > 0.001 ? dx / dist : 1
    const ny = dist > 0.001 ? dy / dist : 0
    ball.x = obs.x + nx * minDist
    ball.y = obs.y + ny * minDist
    bounceBall(ball, nx, ny, 1.05)
    return true
  }
  return false
}

function registerGoal(side: Side) {
  const player = getPlayer(side)
  if (!player?.alive) return

  if (player.shieldUntil > matchTime.value) {
    player.shieldUntil = 0
    serveAll()
    sounds.tick()
    return
  }

  player.lives -= 1
  sounds.fail()

  if (player.lives <= 0) {
    player.alive = false
    lastEliminated.value = player
    if (alivePlayers.value.length <= 1) {
      winner.value = alivePlayers.value[0] ?? null
      phase.value = 'gameover'
      sounds.success()
      return
    }
    phase.value = 'eliminated'
    goalPause.value = GOAL_PAUSE
    serveAll()
    return
  }

  goalPause.value = GOAL_PAUSE
  serveAll()
}

function wallBounce(ball: Ball, side: Side) {
  if (side === 'left') {
    ball.x = BALL_R
    ball.vx = Math.abs(ball.vx) * 0.95
  }
  else if (side === 'right') {
    ball.x = FIELD - BALL_R
    ball.vx = -Math.abs(ball.vx) * 0.95
  }
  else if (side === 'top') {
    ball.y = BALL_R
    ball.vy = Math.abs(ball.vy) * 0.95
  }
  else {
    ball.y = FIELD - BALL_R
    ball.vy = -Math.abs(ball.vy) * 0.95
  }
}

function handleBoundary(ball: Ball, side: Side): boolean {
  const coord = side === 'left' || side === 'right' ? ball.y : ball.x

  if (!sideIsGoal(side)) {
    wallBounce(ball, side)
    return false
  }

  if (paddleBlocks(side, coord)) {
    collidePaddle(ball, side)
    return false
  }

  registerGoal(side)
  return true
}

function stepBall(ball: Ball, dt: number): boolean {
  applyMagnetForce(ball, dt)
  ball.x += ball.vx * dt
  ball.y += ball.vy * dt

  if (electricUntil.value > matchTime.value) {
    const corners = [
      { x: 60, y: 60 },
      { x: FIELD - 60, y: 60 },
      { x: 60, y: FIELD - 60 },
      { x: FIELD - 60, y: FIELD - 60 },
    ]
    for (const c of corners) {
      if (Math.hypot(ball.x - c.x, ball.y - c.y) < 55) {
        ball.vx *= 0.92
        ball.vy *= 0.92
      }
    }
  }

  if (ball.x - BALL_R < 0 && handleBoundary(ball, 'left')) return true
  if (ball.x + BALL_R > FIELD && handleBoundary(ball, 'right')) return true
  if (ball.y - BALL_R < 0 && handleBoundary(ball, 'top')) return true
  if (ball.y + BALL_R > FIELD && handleBoundary(ball, 'bottom')) return true

  collidePaddle(ball, 'left')
  collidePaddle(ball, 'right')
  collidePaddle(ball, 'top')
  collidePaddle(ball, 'bottom')
  collideObstacles(ball)
  applySpeedLimits(ball)
  return false
}

function simulate(dt: number) {
  if (goalPause.value > 0) {
    goalPause.value -= dt
    if (phase.value === 'eliminated' && goalPause.value <= 0) {
      phase.value = 'playing'
      lastEliminated.value = null
    }
    return
  }

  const steps = clamp(Math.ceil(dt * 60), 1, 4)
  const stepDt = dt / steps

  for (let s = 0; s < steps; s++) {
    for (const ball of [...balls.value]) {
      const ended = stepBall(ball, stepDt)
      if (ended) return
    }
  }

  const totalSpeed = balls.value.reduce((sum, b) => sum + Math.hypot(b.vx, b.vy), 0)
  if (totalSpeed < 80) {
    stallTimer.value += dt
    if (stallTimer.value > 2.5) {
      stallTimer.value = 0
      for (const ball of balls.value) {
        const a = Math.random() * Math.PI * 2
        ball.vx = Math.cos(a) * SERVE_SPEED
        ball.vy = Math.sin(a) * SERVE_SPEED
      }
    }
  }
  else {
    stallTimer.value = 0
  }
}

function spawnPowerUp() {
  const types: PowerUpType[] = [
    'multiball', 'speed', 'shield', 'bomb', 'slow', 'magnet', 'reverse',
  ]
  const type = types[Math.floor(Math.random() * types.length)]!
  const margin = 70
  powerUps.value.push({
    id: ++powerUpId,
    x: margin + Math.random() * (FIELD - margin * 2),
    y: margin + Math.random() * (FIELD - margin * 2),
    type,
  })
}

function applyPowerUp(type: PowerUpType, collector?: Side) {
  arenaBanner.value = `${POWERUP_META[type].emoji} ${POWERUP_META[type].label}`
  arenaBannerTimer.value = 2

  switch (type) {
    case 'multiball':
      spawnBall(Math.random() * Math.PI * 2)
      spawnBall(Math.random() * Math.PI * 2)
      sounds.success()
      break
    case 'speed':
      speedBoostUntil.value = matchTime.value + 5
      sounds.tick()
      break
    case 'slow':
      slowUntil.value = matchTime.value + 4
      sounds.tick()
      break
    case 'shield':
      if (collector) {
        const p = getPlayer(collector)
        if (p) p.shieldUntil = matchTime.value + 6
      }
      sounds.tick()
      break
    case 'bomb':
      if (collector) {
        const p = getPlayer(collector)
        if (p) {
          p.lives = Math.max(0, p.lives - 1)
          if (p.lives <= 0) {
            p.alive = false
            lastEliminated.value = p
            if (alivePlayers.value.length <= 1) {
              winner.value = alivePlayers.value[0] ?? null
              phase.value = 'gameover'
              sounds.success()
            }
            else {
              phase.value = 'eliminated'
              goalPause.value = GOAL_PAUSE
            }
          }
        }
      }
      sounds.fail()
      break
    case 'magnet': {
      const target = pickOpponentSide(collector)
      if (target) {
        magnetTargetSide.value = target
        magnetUntil.value = matchTime.value + MAGNET_DURATION
        const victim = getPlayer(target)
        arenaBanner.value = `🧲 Magnet → ${victim?.name ?? 'rival'}`
        arenaBannerTimer.value = 2.5
      }
      sounds.tick()
      break
    }
    case 'reverse': {
      const victimSide = pickOpponentSide(collector)
      const victim = victimSide ? getPlayer(victimSide) : null
      if (victim) {
        victim.reverseUntil = matchTime.value + REVERSE_DURATION
        arenaBanner.value = `↔️ Reverse → ${victim.name}`
        arenaBannerTimer.value = 2.5
      }
      sounds.tick()
      break
    }
  }
}

function collectPowerUps() {
  for (const ball of balls.value) {
    for (let i = powerUps.value.length - 1; i >= 0; i--) {
      const pu = powerUps.value[i]!
      if (Math.hypot(ball.x - pu.x, ball.y - pu.y) < BALL_R + 16) {
        const nearest = activeSides.value.reduce<{ side: Side; dist: number } | null>((best, side) => {
          let dist = Infinity
          if (side === 'left') dist = ball.x
          else if (side === 'right') dist = FIELD - ball.x
          else if (side === 'top') dist = ball.y
          else dist = FIELD - ball.y
          if (!best || dist < best.dist) return { side, dist }
          return best
        }, null)
        applyPowerUp(pu.type, nearest?.side)
        powerUps.value.splice(i, 1)
      }
    }
  }
}

function triggerArenaEvent() {
  const events: ArenaEvent[] = ['speed', 'obstacles', 'smallPaddles', 'darkness', 'electric']
  const pick = events[Math.floor(Math.random() * events.length)]!
  arenaEvent.value = pick
  const meta = ARENA_META[pick]
  arenaBanner.value = `${meta.emoji} ${meta.label}`
  arenaBannerTimer.value = 2.5

  switch (pick) {
    case 'speed':
      speedBoostUntil.value = matchTime.value + 8
      break
    case 'obstacles':
      obstacles.value = [
        { x: FIELD / 2, y: FIELD / 2, r: 36 },
        { x: FIELD * 0.3, y: FIELD * 0.65, r: 24 },
        { x: FIELD * 0.7, y: FIELD * 0.35, r: 24 },
      ]
      break
    case 'smallPaddles':
      smallPaddlesUntil.value = matchTime.value + 12
      break
    case 'darkness':
      darkUntil.value = matchTime.value + 10
      break
    case 'electric':
      electricUntil.value = matchTime.value + 10
      break
  }
}

function updatePaddles(dt: number) {
  for (const player of players.value) {
    if (!player.alive) continue

    const half = paddleLen.value / 2
    const min = half
    const max = FIELD - half

    const target = pointerTargets.get(player.side)
    if (target !== undefined) {
      player.paddlePos = clamp(mirrorPaddlePos(player, target), min, max)
      continue
    }

    const keyMap: Record<Side, { neg: string; pos: string }> = {
      left: { neg: 'w', pos: 's' },
      right: { neg: 'arrowup', pos: 'arrowdown' },
      top: { neg: 'a', pos: 'd' },
      bottom: { neg: 'j', pos: 'l' },
    }
    const km = keyMap[player.side]
    let delta = ((keys.has(km.pos) ? 1 : 0) - (keys.has(km.neg) ? 1 : 0)) * PADDLE_SPEED * dt
    if (isReversed(player)) delta *= -1
    if (delta) {
      player.paddlePos = clamp(player.paddlePos + delta, min, max)
    }
  }
}

function updateMatch(dt: number) {
  if (phase.value !== 'playing') return

  matchTime.value += dt
  if (arenaBannerTimer.value > 0) arenaBannerTimer.value -= dt

  if (matchTime.value >= nextArenaAt.value) {
    nextArenaAt.value += ARENA_INTERVAL
    triggerArenaEvent()
  }

  if (matchTime.value >= nextPowerUpAt.value) {
    nextPowerUpAt.value += POWERUP_INTERVAL
    if (powerUps.value.length < 2) spawnPowerUp()
  }

  collectPowerUps()
}

function drawField(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, FIELD, FIELD)
  g.addColorStop(0, '#0c0c12')
  g.addColorStop(0.5, '#14101a')
  g.addColorStop(1, '#0c0c12')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, FIELD, FIELD)

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 2
  ctx.strokeRect(8, 8, FIELD - 16, FIELD - 16)

  ctx.beginPath()
  ctx.arc(FIELD / 2, FIELD / 2, 60, 0, Math.PI * 2)
  ctx.stroke()

  if (electricUntil.value > matchTime.value) {
    for (const c of [
      { x: 60, y: 60 },
      { x: FIELD - 60, y: 60 },
      { x: 60, y: FIELD - 60 },
      { x: FIELD - 60, y: FIELD - 60 },
    ]) {
      ctx.fillStyle = 'rgba(251,191,36,0.12)'
      ctx.beginPath()
      ctx.arc(c.x, c.y, 55, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (const obs of obstacles.value) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, player: PlayerState) {
  if (!player.alive) return

  const len = paddleLen.value
  const pos = player.paddlePos
  let x = 0
  let y = 0
  let w = 0
  let h = 0

  if (player.side === 'left') {
    x = 0; y = pos - len / 2; w = PADDLE_THICK; h = len
  }
  else if (player.side === 'right') {
    x = FIELD - PADDLE_THICK; y = pos - len / 2; w = PADDLE_THICK; h = len
  }
  else if (player.side === 'top') {
    x = pos - len / 2; y = 0; w = len; h = PADDLE_THICK
  }
  else {
    x = pos - len / 2; y = FIELD - PADDLE_THICK; w = len; h = PADDLE_THICK
  }

  ctx.save()
  ctx.shadowColor = player.color
  ctx.shadowBlur = player.shieldUntil > matchTime.value ? 24 : 12
  ctx.fillStyle = player.color
  ctx.fillRect(x, y, w, h)

  if (isReversed(player)) {
    ctx.strokeStyle = 'rgba(251,146,60,0.9)'
    ctx.lineWidth = 3
    ctx.setLineDash([6, 4])
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
    ctx.setLineDash([])
  }

  if (player.charge > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    const chargeW = (player.side === 'left' || player.side === 'right') ? w : (w * player.charge) / 100
    const chargeH = (player.side === 'top' || player.side === 'bottom') ? h : (h * player.charge) / 100
    if (player.side === 'left' || player.side === 'right') {
      ctx.fillRect(x, y + h - chargeH, w, chargeH)
    }
    else {
      ctx.fillRect(x, y, chargeW, h)
    }
  }
  ctx.restore()
}

function drawBalls(ctx: CanvasRenderingContext2D) {
  const magnetActive = magnetUntil.value > matchTime.value && magnetTargetSide.value

  for (const ball of balls.value) {
    if (magnetActive && magnetTargetSide.value) {
      const target = getPaddleCenter(magnetTargetSide.value)
      ctx.save()
      ctx.strokeStyle = 'rgba(244,114,182,0.35)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(ball.x, ball.y)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.shadowColor = magnetActive ? '#f472b6' : '#ffffff'
    ctx.shadowBlur = magnetActive ? 20 : 16
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
    ctx.fillStyle = magnetActive ? '#ffe4f0' : '#f4f4f8'
    ctx.fill()
    ctx.restore()
  }
}

function drawPowerUps(ctx: CanvasRenderingContext2D) {
  for (const pu of powerUps.value) {
    const meta = POWERUP_META[pu.type]
    ctx.save()
    ctx.shadowColor = meta.color
    ctx.shadowBlur = 14
    ctx.beginPath()
    ctx.arc(pu.x, pu.y, 14, 0, Math.PI * 2)
    ctx.fillStyle = meta.color
    ctx.fill()
    ctx.fillStyle = '#0a0a0e'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(meta.emoji, pu.x, pu.y + 1)
    ctx.restore()
  }
}

function drawHud(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.font = 'bold 11px system-ui'
  ctx.textBaseline = 'top'

  for (const player of players.value) {
    const status = [
      '❤️'.repeat(player.lives),
      player.alive ? '' : '💀',
      isReversed(player) ? '↔️' : '',
      player.shieldUntil > matchTime.value ? '🛡️' : '',
    ].filter(Boolean).join(' ')
    ctx.fillStyle = player.color
    if (player.side === 'top') {
      ctx.textAlign = 'center'
      ctx.fillText(`${player.name} ${status}`, FIELD / 2, 18)
    }
    else if (player.side === 'bottom') {
      ctx.textAlign = 'center'
      ctx.fillText(`${player.name} ${status}`, FIELD / 2, FIELD - 28)
    }
    else if (player.side === 'left') {
      ctx.save()
      ctx.translate(18, FIELD / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText(`${player.name} ${status}`, 0, 0)
      ctx.restore()
    }
    else {
      ctx.save()
      ctx.translate(FIELD - 18, FIELD / 2)
      ctx.rotate(Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText(`${player.name} ${status}`, 0, 0)
      ctx.restore()
    }
  }

  const timeLeft = Math.max(0, SUDDEN_DEATH - matchTime.value)
  if (alivePlayers.value.length > 1 && matchTime.value < SUDDEN_DEATH) {
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(`${Math.ceil(timeLeft)}s`, FIELD / 2, FIELD / 2 - 6)
  }
  else if (alivePlayers.value.length > 1) {
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,77,148,0.8)'
    ctx.fillText('MUERTE SÚBITA', FIELD / 2, FIELD / 2 - 6)
  }
  ctx.restore()
}

function draw(ctx: CanvasRenderingContext2D) {
  drawField(ctx)
  for (const p of players.value) drawPaddle(ctx, p)
  drawPowerUps(ctx)
  drawBalls(ctx)
  drawHud(ctx)

  if (darkUntil.value > matchTime.value) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, FIELD, FIELD)
    ctx.clearRect(FIELD * 0.25, FIELD * 0.25, FIELD * 0.5, FIELD * 0.5)
  }
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return

  const dt = Math.min((now - lastFrame) / 1000, 1 / 30) || 1 / 60
  lastFrame = now

  updatePaddles(dt)

  if (phase.value === 'playing' || phase.value === 'eliminated') {
    simulate(dt)
    updateMatch(dt)
  }

  draw(ctx)
}

function nearestSide(x: number, y: number): Side | null {
  const dists: { side: Side; d: number }[] = []
  if (activeSides.value.includes('top')) dists.push({ side: 'top', d: y })
  if (activeSides.value.includes('bottom')) dists.push({ side: 'bottom', d: FIELD - y })
  if (activeSides.value.includes('left')) dists.push({ side: 'left', d: x })
  if (activeSides.value.includes('right')) dists.push({ side: 'right', d: FIELD - x })
  dists.sort((a, b) => a.d - b.d)
  const nearest = dists[0]
  if (!nearest || nearest.d > 90) return null
  return nearest.side
}

function pointerToField(event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD,
    y: ((event.clientY - rect.top) / rect.height) * FIELD,
  }
}

function onPointerDown(event: PointerEvent) {
  const pos = pointerToField(event)
  if (!pos) return
  event.preventDefault()
  const side = nearestSide(pos.x, pos.y)
  if (!side) return
  const player = getPlayer(side)
  if (!player?.alive) return
  pointerSides.set(event.pointerId, side)
  pointerTargets.set(side, player.side === 'left' || player.side === 'right' ? pos.y : pos.x)
  try { canvasRef.value?.setPointerCapture(event.pointerId) } catch { /* noop */ }
}

function onPointerMove(event: PointerEvent) {
  const side = pointerSides.get(event.pointerId)
  if (!side) return
  const pos = pointerToField(event)
  if (!pos) return
  event.preventDefault()
  pointerTargets.set(side, side === 'left' || side === 'right' ? pos.y : pos.x)
}

function onPointerUp(event: PointerEvent) {
  const side = pointerSides.get(event.pointerId)
  if (!side) return
  pointerSides.delete(event.pointerId)
  pointerTargets.delete(side)
}

const TRACKED_KEYS = new Set(['w', 's', 'a', 'd', 'j', 'l', 'arrowup', 'arrowdown'])

function onKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  if (!TRACKED_KEYS.has(key)) return
  event.preventDefault()
  keys.add(key)
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.key.toLowerCase())
}

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = FIELD * dpr
  canvas.height = FIELD * dpr
  canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

onMounted(() => {
  setupCanvas()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  lastFrame = performance.now()
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  if (raf !== null) cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col items-center gap-4">
    <div class="grid w-full grid-cols-2 gap-2 text-xs text-on-surface-variant sm:grid-cols-4">
      <div
        v-for="player in players"
        :key="player.side"
        class="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 px-2 py-1.5"
        :class="{ 'opacity-40': !player.alive }"
      >
        <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: player.color }" />
        <span>{{ player.name }}</span>
        <span>{{ '❤️'.repeat(player.lives) }}{{ player.alive ? '' : '💀' }}{{ player.reverseUntil > matchTime ? ' ↔️' : '' }}</span>
      </div>
    </div>

    <div
      class="relative aspect-square w-full overflow-hidden rounded-3xl border border-outline-variant/30 bg-black"
      style="max-width: min(520px, 82vw)"
    >
      <canvas
        ref="canvasRef"
        class="block h-full w-full touch-none select-none"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
      />

      <!-- Arena / power-up banner -->
      <div
        v-if="arenaBanner && arenaBannerTimer > 0 && phase === 'playing'"
        class="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center"
      >
        <span class="rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-on-surface backdrop-blur-sm">
          {{ arenaBanner }}
        </span>
      </div>

      <!-- Intro -->
      <div
        v-if="phase === 'intro'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-black/88 p-4 text-center backdrop-blur-sm"
      >
        <div>
          <p class="text-4xl">
            🏓
          </p>
          <h2 class="mt-2 font-headline-lg text-xl text-on-surface">
            Pong Battle
          </h2>
          <p class="mt-1 text-xs leading-snug text-on-surface-variant">
            Battle royale en un solo celular. Defiende tu lado, recoge power-ups y sé el último en pie.
          </p>
        </div>

        <div class="w-full">
          <p class="mb-2 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Jugadores
          </p>
          <div class="flex justify-center gap-2">
            <button
              v-for="n in PLAYER_OPTIONS"
              :key="n"
              type="button"
              class="h-10 w-12 rounded-xl border font-headline-lg transition-colors"
              :class="playerCount === n
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'"
              @click="playerCount = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div class="w-full">
          <p class="mb-2 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Vidas
          </p>
          <div class="flex justify-center gap-2">
            <button
              v-for="n in LIFE_OPTIONS"
              :key="n"
              type="button"
              class="h-10 w-12 rounded-xl border font-headline-lg transition-colors"
              :class="startingLives === n
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'"
              @click="startingLives = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
          @click="startMatch"
        >
          Empezar batalla
        </button>
      </div>

      <!-- Eliminated flash -->
      <div
        v-else-if="phase === 'eliminated' && lastEliminated"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="rounded-2xl bg-black/80 px-6 py-4 text-center">
          <p class="text-3xl">
            💀
          </p>
          <p class="mt-2 font-headline-lg text-xl" :style="{ color: lastEliminated.color }">
            {{ lastEliminated.name }} eliminado
          </p>
          <p class="mt-1 text-sm text-on-surface-variant">
            Quedan {{ alivePlayers.length }} jugadores
          </p>
        </div>
      </div>

      <!-- Game over -->
      <div
        v-else-if="phase === 'gameover'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/88 p-6 text-center backdrop-blur-sm"
      >
        <div>
          <p class="text-5xl">
            🏆
          </p>
          <h2
            v-if="winner"
            class="mt-3 font-headline-lg text-3xl"
            :style="{ color: winner.color }"
          >
            Gana {{ winner.name }}
          </h2>
          <p class="mt-2 text-sm text-on-surface-variant">
            Battle royale completada
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="rounded-xl border border-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider text-primary transition-all hover:bg-primary/10"
            @click="emit('finish')"
          >
            Salir
          </button>
          <button
            type="button"
            class="rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
            @click="startMatch"
          >
            Revancha
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-1 text-center text-xs text-on-surface-variant">
      <p>Pon el celular en horizontal sobre la mesa. Cada jugador desliza el dedo por su borde.</p>
      <p>Power-ups: multiball, speed, escudo, bomba, slow, magnet 🧲 y reverse ↔️</p>
      <p>Golpe perfecto en el centro de la paleta carga el súper golpe ⚡</p>
      <p class="hidden md:block">
        Teclado: P1 W/S · P2 ↑/↓ · P3 A/D · P4 J/L
      </p>
    </div>
  </div>
</template>
