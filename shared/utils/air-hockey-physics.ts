export const AH_FIELD_W = 400
export const AH_FIELD_H = 700
export const AH_PUCK_RADIUS = 15
export const AH_MALLET_RADIUS = 33
export const AH_GOAL_HALF_WIDTH = 82
export const AH_MAX_PUCK_SPEED = 1150
export const AH_MIN_SERVE_SPEED = 210
export const AH_GOAL_PAUSE_MS = 1300
export const AH_STALL_SPEED = 40
export const AH_STALL_LIMIT_MS = 3000

export type AirHockeySide = 'bottom' | 'top'
export type AirHockeyGoal = 'top' | 'bottom'

export interface AirHockeyMallet {
  x: number
  y: number
  vx: number
  vy: number
}

export interface AirHockeyPuck {
  x: number
  y: number
  vx: number
  vy: number
}

export interface AirHockeySimState {
  bottom: AirHockeyMallet
  top: AirHockeyMallet
  puck: AirHockeyPuck
  stallSince: number | null
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function bottomMalletBounds() {
  return {
    minX: AH_MALLET_RADIUS,
    maxX: AH_FIELD_W - AH_MALLET_RADIUS,
    minY: AH_FIELD_H / 2 + AH_MALLET_RADIUS,
    maxY: AH_FIELD_H - AH_MALLET_RADIUS,
  }
}

export function topMalletBounds() {
  return {
    minX: AH_MALLET_RADIUS,
    maxX: AH_FIELD_W - AH_MALLET_RADIUS,
    minY: AH_MALLET_RADIUS,
    maxY: AH_FIELD_H / 2 - AH_MALLET_RADIUS,
  }
}

export function clampBottomMallet(x: number, y: number) {
  const b = bottomMalletBounds()
  return { x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY) }
}

export function clampTopMallet(x: number, y: number) {
  const b = topMalletBounds()
  return { x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY) }
}

export function createInitialState(): AirHockeySimState {
  return {
    bottom: {
      x: AH_FIELD_W / 2,
      y: AH_FIELD_H - 110,
      vx: 0,
      vy: 0,
    },
    top: {
      x: AH_FIELD_W / 2,
      y: 110,
      vx: 0,
      vy: 0,
    },
    puck: { x: AH_FIELD_W / 2, y: AH_FIELD_H / 2, vx: 0, vy: 0 },
    stallSince: null,
  }
}

/** Serves toward the side that was just scored on. */
export function servePuck(state: AirHockeySimState, toward: AirHockeySide) {
  const angle = (Math.random() - 0.5) * 0.9
  const direction = toward === 'bottom' ? 1 : -1
  state.puck.x = AH_FIELD_W / 2
  state.puck.y = AH_FIELD_H / 2
  state.puck.vx = Math.sin(angle) * AH_MIN_SERVE_SPEED
  state.puck.vy = Math.cos(angle) * AH_MIN_SERVE_SPEED * direction
  state.stallSince = null
}

function bounceBall(puck: AirHockeyPuck, nx: number, ny: number, boost = 1) {
  const dot = puck.vx * nx + puck.vy * ny
  puck.vx = (puck.vx - 2 * dot * nx) * boost
  puck.vy = (puck.vy - 2 * dot * ny) * boost
  const speed = Math.hypot(puck.vx, puck.vy)
  const min = AH_MIN_SERVE_SPEED * boost
  if (speed < min) {
    puck.vx = (puck.vx / (speed || 1)) * min
    puck.vy = (puck.vy / (speed || 1)) * min
  }
}

function collideWithMallet(puck: AirHockeyPuck, mallet: AirHockeyMallet) {
  const dx = puck.x - mallet.x
  const dy = puck.y - mallet.y
  const minDist = AH_PUCK_RADIUS + AH_MALLET_RADIUS
  const dist = Math.hypot(dx, dy)
  if (dist >= minDist) return false

  const nx = dist > 0.0001 ? dx / dist : 0
  const ny = dist > 0.0001 ? dy / dist : -1

  puck.x = mallet.x + nx * minDist
  puck.y = mallet.y + ny * minDist

  const relVx = puck.vx - mallet.vx
  const relVy = puck.vy - mallet.vy
  const approach = relVx * nx + relVy * ny

  if (approach < 0) {
    puck.vx -= 1.9 * approach * nx
    puck.vy -= 1.9 * approach * ny
  }

  puck.vx += mallet.vx * 0.45
  puck.vy += mallet.vy * 0.45

  const speed = Math.hypot(puck.vx, puck.vy)
  if (speed < AH_MIN_SERVE_SPEED) {
    puck.vx = nx * AH_MIN_SERVE_SPEED
    puck.vy = ny * AH_MIN_SERVE_SPEED
  }

  return true
}

function stepPuck(state: AirHockeySimState, dt: number): AirHockeyGoal | null {
  const puck = state.puck
  puck.x += puck.vx * dt
  puck.y += puck.vy * dt

  if (puck.x - AH_PUCK_RADIUS < 0) {
    puck.x = AH_PUCK_RADIUS
    puck.vx = Math.abs(puck.vx) * 0.94
  }
  else if (puck.x + AH_PUCK_RADIUS > AH_FIELD_W) {
    puck.x = AH_FIELD_W - AH_PUCK_RADIUS
    puck.vx = -Math.abs(puck.vx) * 0.94
  }

  const insideGoalMouth = Math.abs(puck.x - AH_FIELD_W / 2) <= AH_GOAL_HALF_WIDTH

  if (puck.y - AH_PUCK_RADIUS <= 0) {
    if (insideGoalMouth) return 'top'
    puck.y = AH_PUCK_RADIUS
    puck.vy = Math.abs(puck.vy) * 0.94
  }
  else if (puck.y + AH_PUCK_RADIUS >= AH_FIELD_H) {
    if (insideGoalMouth) return 'bottom'
    puck.y = AH_FIELD_H - AH_PUCK_RADIUS
    puck.vy = -Math.abs(puck.vy) * 0.94
  }

  collideWithMallet(puck, state.bottom)
  collideWithMallet(puck, state.top)

  const damping = Math.exp(-0.42 * dt)
  puck.vx *= damping
  puck.vy *= damping

  const speed = Math.hypot(puck.vx, puck.vy)
  if (speed > AH_MAX_PUCK_SPEED) {
    puck.vx = (puck.vx / speed) * AH_MAX_PUCK_SPEED
    puck.vy = (puck.vy / speed) * AH_MAX_PUCK_SPEED
  }

  return null
}

function breakStall(state: AirHockeySimState, now: number) {
  const puck = state.puck
  if (Math.hypot(puck.vx, puck.vy) > AH_STALL_SPEED) {
    state.stallSince = null
    return
  }

  if (state.stallSince === null) {
    state.stallSince = now
    return
  }

  if (now - state.stallSince < AH_STALL_LIMIT_MS) return

  state.stallSince = null
  const angle = Math.random() * Math.PI * 2
  puck.vx = Math.cos(angle) * AH_MIN_SERVE_SPEED
  puck.vy = Math.sin(angle) * AH_MIN_SERVE_SPEED
}

/** Returns which goal was scored, if any. */
export function simulateAirHockeyStep(
  state: AirHockeySimState,
  dt: number,
  now = Date.now(),
): AirHockeyGoal | null {
  const speed = Math.hypot(state.puck.vx, state.puck.vy)
  const steps = clamp(Math.ceil((speed * dt) / (AH_PUCK_RADIUS * 0.8)), 1, 8)
  const stepDt = dt / steps

  for (let i = 0; i < steps; i++) {
    const goal = stepPuck(state, stepDt)
    if (goal) return goal
  }

  breakStall(state, now)
  return null
}

export function goalToScorer(goal: AirHockeyGoal): AirHockeySide {
  return goal === 'top' ? 'bottom' : 'top'
}

export function scorerToServeTarget(scorer: AirHockeySide): AirHockeySide {
  return scorer === 'bottom' ? 'top' : 'bottom'
}
