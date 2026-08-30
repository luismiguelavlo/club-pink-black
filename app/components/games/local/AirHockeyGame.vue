<script setup lang="ts">
const emit = defineEmits<{
  finish: []
}>()

const sounds = usePartySounds()

type Phase = 'intro' | 'goal' | 'playing' | 'gameover'
type Side = 'p1' | 'p2'

interface Mallet {
  x: number
  y: number
  vx: number
  vy: number
  minY: number
  maxY: number
}

interface Puck {
  x: number
  y: number
  vx: number
  vy: number
}

const FIELD_W = 400
const FIELD_H = 700
const PUCK_RADIUS = 15
const MALLET_RADIUS = 33
const GOAL_HALF_WIDTH = 82
const MAX_PUCK_SPEED = 1150
const MIN_SERVE_SPEED = 210
const KEY_SPEED = 540
const GOAL_PAUSE = 1.3
const STALL_LIMIT = 3

const P1_COLOR = '#ff4d94'
const P2_COLOR = '#38e0e0'

const SCORE_OPTIONS = [3, 5, 7] as const

const canvasRef = ref<HTMLCanvasElement | null>(null)
const phase = ref<Phase>('intro')
const scoreP1 = ref(0)
const scoreP2 = ref(0)
const targetScore = ref<number>(5)
const lastScorer = ref<Side | null>(null)
const winner = ref<Side | null>(null)

const winnerName = computed(() => (winner.value === 'p1' ? 'Jugador 1' : 'Jugador 2'))
const winnerColor = computed(() => (winner.value === 'p1' ? P1_COLOR : P2_COLOR))
const scorerName = computed(() => (lastScorer.value === 'p1' ? 'Jugador 1' : 'Jugador 2'))
const scorerColor = computed(() => (lastScorer.value === 'p1' ? P1_COLOR : P2_COLOR))

const mallets: Record<Side, Mallet> = {
  p1: {
    x: FIELD_W / 2,
    y: FIELD_H - 110,
    vx: 0,
    vy: 0,
    minY: FIELD_H / 2 + MALLET_RADIUS,
    maxY: FIELD_H - MALLET_RADIUS,
  },
  p2: {
    x: FIELD_W / 2,
    y: 110,
    vx: 0,
    vy: 0,
    minY: MALLET_RADIUS,
    maxY: FIELD_H / 2 - MALLET_RADIUS,
  },
}

const puck: Puck = { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 }

/** Which half each active pointer is steering, keyed by pointerId. */
const pointerSides = new Map<number, Side>()
const pointerTargets: Record<Side, { x: number; y: number } | null> = { p1: null, p2: null }
const keys = new Set<string>()

let raf: number | null = null
let lastFrame = 0
let goalTimer = 0
let stallTimer = 0

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function resetMallets() {
  mallets.p1.x = FIELD_W / 2
  mallets.p1.y = FIELD_H - 110
  mallets.p2.x = FIELD_W / 2
  mallets.p2.y = 110
  for (const side of ['p1', 'p2'] as const) {
    mallets[side].vx = 0
    mallets[side].vy = 0
    pointerTargets[side] = null
  }
}

/** Serves the puck toward `towards`, so whoever was just scored on gets possession. */
function serve(towards: Side) {
  const angle = (Math.random() - 0.5) * 0.9
  const direction = towards === 'p1' ? 1 : -1
  puck.x = FIELD_W / 2
  puck.y = FIELD_H / 2
  puck.vx = Math.sin(angle) * MIN_SERVE_SPEED
  puck.vy = Math.cos(angle) * MIN_SERVE_SPEED * direction
  stallTimer = 0
}

function startMatch() {
  scoreP1.value = 0
  scoreP2.value = 0
  winner.value = null
  lastScorer.value = null
  resetMallets()
  serve(Math.random() < 0.5 ? 'p1' : 'p2')
  phase.value = 'playing'
  sounds.startRound()
}

function registerGoal(scorer: Side) {
  if (scorer === 'p1') scoreP1.value += 1
  else scoreP2.value += 1

  lastScorer.value = scorer
  puck.vx = 0
  puck.vy = 0

  if (scoreP1.value >= targetScore.value || scoreP2.value >= targetScore.value) {
    winner.value = scorer
    phase.value = 'gameover'
    sounds.success()
    return
  }

  goalTimer = GOAL_PAUSE
  phase.value = 'goal'
  sounds.fail()
}

function updateMallets(dt: number) {
  for (const side of ['p1', 'p2'] as const) {
    const mallet = mallets[side]
    const prevX = mallet.x
    const prevY = mallet.y
    const target = pointerTargets[side]

    if (target) {
      mallet.x = clamp(target.x, MALLET_RADIUS, FIELD_W - MALLET_RADIUS)
      mallet.y = clamp(target.y, mallet.minY, mallet.maxY)
    }
    else {
      const left = side === 'p1' ? keys.has('arrowleft') : keys.has('a')
      const right = side === 'p1' ? keys.has('arrowright') : keys.has('d')
      const up = side === 'p1' ? keys.has('arrowup') : keys.has('w')
      const down = side === 'p1' ? keys.has('arrowdown') : keys.has('s')
      const dx = (right ? 1 : 0) - (left ? 1 : 0)
      const dy = (down ? 1 : 0) - (up ? 1 : 0)

      if (dx || dy) {
        mallet.x = clamp(mallet.x + dx * KEY_SPEED * dt, MALLET_RADIUS, FIELD_W - MALLET_RADIUS)
        mallet.y = clamp(mallet.y + dy * KEY_SPEED * dt, mallet.minY, mallet.maxY)
      }
    }

    mallet.vx = (mallet.x - prevX) / dt
    mallet.vy = (mallet.y - prevY) / dt
  }
}

function collideWithMallet(mallet: Mallet) {
  const dx = puck.x - mallet.x
  const dy = puck.y - mallet.y
  const minDist = PUCK_RADIUS + MALLET_RADIUS
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
  if (speed < MIN_SERVE_SPEED) {
    puck.vx = nx * MIN_SERVE_SPEED
    puck.vy = ny * MIN_SERVE_SPEED
  }

  return true
}

/** Returns the scoring side when the puck crosses a goal line, otherwise null. */
function stepPuck(dt: number): Side | null {
  puck.x += puck.vx * dt
  puck.y += puck.vy * dt

  if (puck.x - PUCK_RADIUS < 0) {
    puck.x = PUCK_RADIUS
    puck.vx = Math.abs(puck.vx) * 0.94
  }
  else if (puck.x + PUCK_RADIUS > FIELD_W) {
    puck.x = FIELD_W - PUCK_RADIUS
    puck.vx = -Math.abs(puck.vx) * 0.94
  }

  const insideGoalMouth = Math.abs(puck.x - FIELD_W / 2) <= GOAL_HALF_WIDTH

  if (puck.y - PUCK_RADIUS <= 0) {
    if (insideGoalMouth) return 'p1'
    puck.y = PUCK_RADIUS
    puck.vy = Math.abs(puck.vy) * 0.94
  }
  else if (puck.y + PUCK_RADIUS >= FIELD_H) {
    if (insideGoalMouth) return 'p2'
    puck.y = FIELD_H - PUCK_RADIUS
    puck.vy = -Math.abs(puck.vy) * 0.94
  }

  let hit = collideWithMallet(mallets.p1)
  hit = collideWithMallet(mallets.p2) || hit

  if (hit) sounds.tick()

  const damping = Math.exp(-0.42 * dt)
  puck.vx *= damping
  puck.vy *= damping

  const speed = Math.hypot(puck.vx, puck.vy)
  if (speed > MAX_PUCK_SPEED) {
    puck.vx = (puck.vx / speed) * MAX_PUCK_SPEED
    puck.vy = (puck.vy / speed) * MAX_PUCK_SPEED
  }

  return null
}

/** Nudges a stalled puck back into play so a match can never soft-lock. */
function breakStall(dt: number) {
  if (Math.hypot(puck.vx, puck.vy) > 40) {
    stallTimer = 0
    return
  }

  stallTimer += dt
  if (stallTimer < STALL_LIMIT) return

  stallTimer = 0
  const angle = Math.random() * Math.PI * 2
  puck.vx = Math.cos(angle) * MIN_SERVE_SPEED
  puck.vy = Math.sin(angle) * MIN_SERVE_SPEED
}

function simulate(dt: number) {
  const speed = Math.hypot(puck.vx, puck.vy)
  const steps = clamp(Math.ceil((speed * dt) / (PUCK_RADIUS * 0.8)), 1, 8)
  const stepDt = dt / steps

  for (let i = 0; i < steps; i++) {
    const scorer = stepPuck(stepDt)
    if (scorer) {
      registerGoal(scorer)
      return
    }
  }

  breakStall(dt)
}

function drawTable(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD_H)
  gradient.addColorStop(0, '#101018')
  gradient.addColorStop(0.5, '#17131d')
  gradient.addColorStop(1, '#101018')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, FIELD_W, FIELD_H)

  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, FIELD_H / 2)
  ctx.lineTo(FIELD_W, FIELD_H / 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(FIELD_W / 2, FIELD_H / 2, 72, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(FIELD_W / 2, FIELD_H / 2, 8, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fill()

  for (const side of ['p1', 'p2'] as const) {
    const atTop = side === 'p2'
    ctx.strokeStyle = atTop ? 'rgba(56,224,224,0.28)' : 'rgba(255,77,148,0.28)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(
      FIELD_W / 2,
      atTop ? 0 : FIELD_H,
      GOAL_HALF_WIDTH + 34,
      atTop ? 0 : Math.PI,
      atTop ? Math.PI : Math.PI * 2,
    )
    ctx.stroke()
  }

  drawGoal(ctx, 'p2')
  drawGoal(ctx, 'p1')
}

function drawGoal(ctx: CanvasRenderingContext2D, defender: Side) {
  const atTop = defender === 'p2'
  const color = atTop ? P2_COLOR : P1_COLOR
  const y = atTop ? 0 : FIELD_H - 10

  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 24
  ctx.fillStyle = color
  ctx.fillRect(FIELD_W / 2 - GOAL_HALF_WIDTH, y, GOAL_HALF_WIDTH * 2, 10)
  ctx.restore()
}

function drawScoreWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 150px system-ui, sans-serif'

  ctx.fillStyle = 'rgba(56,224,224,0.10)'
  ctx.save()
  ctx.translate(FIELD_W / 2, FIELD_H * 0.27)
  ctx.rotate(Math.PI)
  ctx.fillText(String(scoreP2.value), 0, 0)
  ctx.restore()

  ctx.fillStyle = 'rgba(255,77,148,0.10)'
  ctx.fillText(String(scoreP1.value), FIELD_W / 2, FIELD_H * 0.73)
  ctx.restore()
}

function drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 18

  ctx.beginPath()
  ctx.arc(mallet.x, mallet.y, MALLET_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.beginPath()
  ctx.arc(mallet.x, mallet.y, MALLET_RADIUS * 0.58, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(10,10,14,0.85)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(mallet.x, mallet.y, MALLET_RADIUS * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawPuck(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 22
  ctx.beginPath()
  ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = '#f4f4f8'
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  ctx.arc(puck.x, puck.y, PUCK_RADIUS * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()
}

function draw(ctx: CanvasRenderingContext2D) {
  drawTable(ctx)
  drawScoreWatermark(ctx)
  drawMallet(ctx, mallets.p2, P2_COLOR)
  drawMallet(ctx, mallets.p1, P1_COLOR)
  drawPuck(ctx)
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)

  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return

  const dt = Math.min((now - lastFrame) / 1000, 1 / 30) || 1 / 60
  lastFrame = now

  updateMallets(dt)

  if (phase.value === 'playing') {
    simulate(dt)
  }
  else if (phase.value === 'goal') {
    goalTimer -= dt
    if (goalTimer <= 0) {
      serve(lastScorer.value === 'p1' ? 'p2' : 'p1')
      phase.value = 'playing'
    }
  }

  draw(ctx)
}

function pointerToField(event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD_W,
    y: ((event.clientY - rect.top) / rect.height) * FIELD_H,
  }
}

function onPointerDown(event: PointerEvent) {
  const pos = pointerToField(event)
  if (!pos) return

  event.preventDefault()
  const side: Side = pos.y > FIELD_H / 2 ? 'p1' : 'p2'
  pointerSides.set(event.pointerId, side)
  pointerTargets[side] = pos

  try {
    canvasRef.value?.setPointerCapture(event.pointerId)
  }
  catch {
    // Capture is a nicety: without it we still release on the window listener.
  }
}

function onPointerMove(event: PointerEvent) {
  const side = pointerSides.get(event.pointerId)
  if (!side) return

  const pos = pointerToField(event)
  if (!pos) return

  event.preventDefault()
  pointerTargets[side] = pos
}

function onPointerUp(event: PointerEvent) {
  const side = pointerSides.get(event.pointerId)
  if (!side) return

  pointerSides.delete(event.pointerId)
  pointerTargets[side] = null
}

const TRACKED_KEYS = new Set([
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'w',
  'a',
  's',
  'd',
])

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
  canvas.width = FIELD_W * dpr
  canvas.height = FIELD_H * dpr

  const ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
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
    <div class="flex w-full items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: P2_COLOR }" />
        <span class="font-label-sm text-label-sm uppercase text-on-surface-variant">Jugador 2 · arriba</span>
      </div>
      <div class="font-headline-lg text-2xl text-on-surface">
        <span :style="{ color: P2_COLOR }">{{ scoreP2 }}</span>
        <span class="mx-2 text-on-surface-variant">-</span>
        <span :style="{ color: P1_COLOR }">{{ scoreP1 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-label-sm text-label-sm uppercase text-on-surface-variant">Jugador 1 · abajo</span>
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: P1_COLOR }" />
      </div>
    </div>

    <div
      class="relative aspect-[4/7] w-full overflow-hidden rounded-3xl border border-outline-variant/30 bg-black"
      style="max-width: min(440px, calc(78vh * 4 / 7))"
    >
      <canvas
        ref="canvasRef"
        class="block h-full w-full touch-none select-none"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
      />

      <!-- Intro -->
      <div
        v-if="phase === 'intro'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-black/85 p-4 text-center backdrop-blur-sm"
      >
        <div>
          <p class="text-4xl">
            🏒
          </p>
          <h2 class="mt-2 font-headline-lg text-xl text-on-surface">
            Hockey de Aire
          </h2>
          <p class="mt-1 text-xs leading-snug text-on-surface-variant">
            Cada jugador arrastra su mazo en su mitad y mete el disco en la portería contraria.
          </p>
        </div>

        <div class="w-full">
          <p class="mb-2 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Goles para ganar
          </p>
          <div class="flex justify-center gap-2">
            <button
              v-for="option in SCORE_OPTIONS"
              :key="option"
              type="button"
              class="h-10 w-12 rounded-xl border font-headline-lg transition-colors"
              :class="targetScore === option
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'"
              @click="targetScore = option"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="rounded-xl bg-primary px-8 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)]"
          @click="startMatch"
        >
          Empezar
        </button>
      </div>

      <!-- Goal -->
      <div
        v-else-if="phase === 'goal'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="rounded-2xl bg-black/70 px-6 py-4 text-center backdrop-blur-sm">
          <p class="font-headline-lg text-3xl" :style="{ color: scorerColor }">
            ¡GOL!
          </p>
          <p class="mt-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            {{ scorerName }}
          </p>
        </div>
      </div>

      <!-- Game over -->
      <div
        v-else-if="phase === 'gameover'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/85 p-6 text-center backdrop-blur-sm"
      >
        <div>
          <p class="text-5xl">
            🏆
          </p>
          <h2 class="mt-3 font-headline-lg text-3xl" :style="{ color: winnerColor }">
            Gana {{ winnerName }}
          </h2>
          <p class="mt-2 text-2xl text-on-surface">
            {{ scoreP2 }} - {{ scoreP1 }}
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
      <p>Pon el celular sobre la mesa: cada jugador se sienta en un extremo y juega con un dedo.</p>
      <p class="hidden md:block">
        Con teclado: Jugador 1 con las flechas · Jugador 2 con W A S D.
      </p>
    </div>
  </div>
</template>
