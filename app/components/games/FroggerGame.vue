<template>
  <div class="flex h-full w-full items-center justify-center">
    <canvas
      ref="canvasRef"
      :width="640"
      :height="560"
      class="block max-h-full max-w-full"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameProps } from '~/types/games'

const props = defineProps<GameProps>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!

  const COLS = 16
  const ROWS = 14
  const CELL = 40
  const CANVAS_W = COLS * CELL
  const CANVAS_H = ROWS * CELL

  const ROW_GOALS = 0
  const ROW_RIVER_TOP = 1
  const ROW_RIVER_BOT = 6
  const ROW_SAFE_MID = 7
  const ROW_ROAD_TOP = 8
  const ROW_ROAD_BOT = 12
  const ROW_START = 13

  const ROUND_TIME = 15
  const JUMP_MS = 120
  const TURTLE_VISIBLE_MS = 6000
  const TURTLE_SUBMERGED_MS = 2000
  const DEATH_FLASH_MS = 500

  const GOAL_STARTS = [1, 4, 7, 10, 13] as const

  type Direction = 'up' | 'down' | 'left' | 'right'

  interface Entity {
    col: number
    width: number
    type: 'car' | 'truck' | 'log' | 'turtle'
    submerged?: boolean
    submergeTimer?: number
  }

  interface Lane {
    row: number
    speed: number
    dir: 1 | -1
    entities: Entity[]
  }

  interface Frog {
    col: number
    row: number
    animating: boolean
    animT: number
    targetCol: number
    targetRow: number
  }

  function buildLanes(level: number): Lane[] {
    const scale = Math.pow(1.15, level - 1)

    function roadLane(
      row: number,
      dir: 1 | -1,
      baseSpeed: number,
      defs: { col: number; width: number; type: 'car' | 'truck' }[],
    ): Lane {
      return {
        row,
        speed: baseSpeed * scale,
        dir,
        entities: defs.map(d => ({ ...d })),
      }
    }

    function riverLane(
      row: number,
      dir: 1 | -1,
      baseSpeed: number,
      defs: { col: number; width: number; type: 'log' | 'turtle' }[],
    ): Lane {
      return {
        row,
        speed: baseSpeed * scale,
        dir,
        entities: defs.map(d =>
          d.type === 'turtle' ? { ...d, submerged: false, submergeTimer: 0 } : { ...d },
        ),
      }
    }

    return [
      roadLane(12, 1, 0.04, [
        { col: 0, width: 1, type: 'car' },
        { col: 5, width: 1, type: 'car' },
        { col: 10, width: 1, type: 'car' },
      ]),
      roadLane(11, -1, 0.055, [
        { col: 0, width: 3, type: 'truck' },
        { col: 9, width: 3, type: 'truck' },
      ]),
      roadLane(10, 1, 0.05, [
        { col: 0, width: 2, type: 'car' },
        { col: 6, width: 2, type: 'car' },
        { col: 12, width: 2, type: 'car' },
      ]),
      roadLane(9, -1, 0.07, [
        { col: 0, width: 3, type: 'truck' },
        { col: 6, width: 1, type: 'car' },
        { col: 11, width: 3, type: 'truck' },
      ]),
      roadLane(8, 1, 0.065, [
        { col: 0, width: 1, type: 'car' },
        { col: 4, width: 1, type: 'car' },
        { col: 8, width: 1, type: 'car' },
        { col: 12, width: 1, type: 'car' },
      ]),
      riverLane(6, 1, 0.035, [
        { col: 0, width: 3, type: 'log' },
        { col: 6, width: 3, type: 'log' },
        { col: 12, width: 2, type: 'log' },
      ]),
      riverLane(5, -1, 0.04, [
        { col: 1, width: 2, type: 'turtle' },
        { col: 7, width: 2, type: 'turtle' },
        { col: 12, width: 2, type: 'turtle' },
      ]),
      riverLane(4, 1, 0.05, [
        { col: 0, width: 4, type: 'log' },
        { col: 8, width: 4, type: 'log' },
      ]),
      riverLane(3, -1, 0.045, [
        { col: 0, width: 3, type: 'turtle' },
        { col: 6, width: 3, type: 'turtle' },
        { col: 12, width: 2, type: 'turtle' },
      ]),
      riverLane(2, 1, 0.055, [
        { col: 0, width: 3, type: 'log' },
        { col: 8, width: 4, type: 'log' },
      ]),
      riverLane(1, -1, 0.04, [
        { col: 0, width: 3, type: 'log' },
        { col: 6, width: 3, type: 'log' },
        { col: 12, width: 3, type: 'log' },
      ]),
    ]
  }

  function roundTime(level: number): number {
    return Math.max(5, ROUND_TIME - (level - 1) * 0.5)
  }

  function getGoalIdx(col: number): number {
    const c = Math.round(col)
    if (c < 1 || c > 14) return -1
    const rem = (c - 1) % 3
    if (rem >= 2) return -1
    return Math.floor((c - 1) / 3)
  }

  function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
    const lane = lanes.find(l => l.row === frog.row)
    if (!lane) return null
    const center = frog.col + 0.5
    for (const e of lane.entities) {
      if (e.col <= center && center < e.col + e.width) {
        if (e.type === 'turtle' && e.submerged) return null
        return e
      }
    }
    return null
  }

  function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
    const lane = lanes.find(l => l.row === frog.row)
    if (!lane) return false
    for (const e of lane.entities) {
      if (e.col < frog.col + 1 && e.col + e.width > frog.col) return true
    }
    return false
  }

  let lives = 3
  let score = 0
  let level = 1
  let timer = roundTime(1)
  let lanes = buildLanes(1)
  let goals = [false, false, false, false, false]
  let highestRowReached = ROW_START

  const frog: Frog = {
    col: Math.floor(COLS / 2),
    row: ROW_START,
    animating: false,
    animT: 0,
    targetCol: Math.floor(COLS / 2),
    targetRow: ROW_START,
  }

  let pendingDir: Direction | null = null
  let dying = false
  let deathTimer = 0
  let gameEnded = false

  let prevScore = 0
  let prevLives = 3
  let prevLevel = 1

  function fireCallbacks() {
    if (score !== prevScore) {
      prevScore = score
      props.onScoreChange(score)
    }
    if (lives !== prevLives) {
      prevLives = lives
      props.onLivesChange(lives)
    }
    if (level !== prevLevel) {
      prevLevel = level
      props.onLevelChange(level)
    }
  }

  function respawnFrog() {
    frog.col = Math.floor(COLS / 2)
    frog.row = ROW_START
    frog.animating = false
    frog.animT = 0
    frog.targetCol = frog.col
    frog.targetRow = frog.row
    highestRowReached = ROW_START
    timer = roundTime(level)
  }

  function killFrog() {
    if (gameEnded || dying) return
    lives -= 1
    if (lives <= 0) {
      lives = 0
      gameEnded = true
      props.onLivesChange(0)
      props.onGameOver(score)
    } else {
      props.onLivesChange(lives)
      prevLives = lives
      dying = true
      deathTimer = 0
    }
  }

  function completeRound() {
    score += 200
    level += 1
    goals = [false, false, false, false, false]
    lanes = buildLanes(level)
    timer = roundTime(level)
    prevScore = score
    prevLevel = level
    props.onScoreChange(score)
    props.onLevelChange(level)
    respawnFrog()
  }

  function checkGoal() {
    const goalIdx = getGoalIdx(frog.col)
    if (goalIdx === -1) {
      killFrog()
      return
    }
    if (goals[goalIdx]) {
      killFrog()
      return
    }
    goals[goalIdx] = true
    const timeBonus = Math.floor(timer) * 10
    score += 50 + timeBonus
    prevScore = score
    props.onScoreChange(score)
    respawnFrog()
    if (goals.every(Boolean)) completeRound()
  }

  function resolveCellArrival() {
    const { row } = frog

    if (row < highestRowReached) {
      score += (highestRowReached - row) * 10
      highestRowReached = row
      prevScore = score
      props.onScoreChange(score)
    }

    if (row === ROW_GOALS) {
      checkGoal()
      return
    }

    if (row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT) {
      if (checkRoadCollision(frog, lanes)) {
        killFrog()
        return
      }
    }

    if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) {
      if (!getSupport(frog, lanes)) {
        killFrog()
      }
    }
  }

  function attemptMove(dir: Direction) {
    if (frog.animating || dying || gameEnded) return
    const dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
    const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0
    const baseCol = Math.round(frog.col)
    const nextCol = baseCol + dc
    const nextRow = frog.row + dr
    if (nextCol < 0 || nextCol >= COLS) return
    if (nextRow < ROW_GOALS || nextRow > ROW_START) return
    frog.targetCol = nextCol
    frog.targetRow = nextRow
    frog.animating = true
    frog.animT = 0
  }

  function update(dt: number) {
    if (gameEnded) return

    if (dying) {
      deathTimer += dt
      if (deathTimer >= DEATH_FLASH_MS) {
        dying = false
        deathTimer = 0
        respawnFrog()
      }
      return
    }

    for (const lane of lanes) {
      for (const e of lane.entities) {
        e.col += lane.speed * lane.dir * (dt / 16)
        if (lane.dir === 1 && e.col >= COLS) {
          e.col -= COLS + e.width
        } else if (lane.dir === -1 && e.col + e.width <= 0) {
          e.col += COLS + e.width
        }
        if (e.type === 'turtle') {
          const cycle = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS
          e.submergeTimer = ((e.submergeTimer ?? 0) + dt) % cycle
          e.submerged = e.submergeTimer >= TURTLE_VISIBLE_MS
        }
      }
    }

    if (frog.animating) {
      frog.animT += dt
      if (frog.animT >= JUMP_MS) {
        frog.col = frog.targetCol
        frog.row = frog.targetRow
        frog.animating = false
        frog.animT = 0
        resolveCellArrival()
      }
    } else {
      if (pendingDir) {
        attemptMove(pendingDir)
        pendingDir = null
      }

      if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        const support = getSupport(frog, lanes)
        if (!support) {
          killFrog()
          return
        }
        const lane = lanes.find(l => l.row === frog.row)!
        frog.col += lane.speed * lane.dir * (dt / 16)
        if (frog.col < 0 || frog.col >= COLS) {
          killFrog()
          return
        }
      }

      if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision(frog, lanes)) {
          killFrog()
          return
        }
      }
    }

    timer -= dt / 1000
    if (timer <= 0) {
      timer = 0
      killFrog()
      return
    }

    fireCallbacks()
  }

  function draw() {
    // Background
    ctx.fillStyle = '#0a1e38'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Zone backgrounds
    ctx.fillStyle = '#0d2b0d'
    ctx.fillRect(0, ROW_GOALS * CELL, CANVAS_W, CELL)

    ctx.fillStyle = '#001833'
    ctx.fillRect(0, ROW_RIVER_TOP * CELL, CANVAS_W, (ROW_RIVER_BOT - ROW_RIVER_TOP + 1) * CELL)

    ctx.fillStyle = '#112211'
    ctx.fillRect(0, ROW_SAFE_MID * CELL, CANVAS_W, CELL)

    ctx.fillStyle = '#111111'
    ctx.fillRect(0, ROW_ROAD_TOP * CELL, CANVAS_W, (ROW_ROAD_BOT - ROW_ROAD_TOP + 1) * CELL)

    ctx.fillStyle = '#112211'
    ctx.fillRect(0, ROW_START * CELL, CANVAS_W, CELL)

    // Goal mouths
    for (let g = 0; g < 5; g++) {
      const gx = GOAL_STARTS[g] * CELL
      const gy = ROW_GOALS * CELL
      const gw = 2 * CELL
      ctx.fillStyle = goals[g] ? '#1a5c1a' : '#0d2b0d'
      ctx.fillRect(gx, gy, gw, CELL)
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 2
      ctx.strokeRect(gx + 1, gy + 1, gw - 2, CELL - 2)

      if (goals[g]) {
        ctx.fillStyle = '#00cc44'
        ctx.beginPath()
        ctx.ellipse(gx + gw / 2, gy + CELL / 2, 10, 8, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Entities
    const carColors = ['#cc2222', '#2244cc', '#ccaa00', '#aa2299', '#22aacc']
    for (const lane of lanes) {
      for (const e of lane.entities) {
        const ex = e.col * CELL
        const ey = lane.row * CELL
        const ew = e.width * CELL

        if (e.type === 'car') {
          const laneIdx = lanes.indexOf(lane)
          const carColor = carColors[laneIdx % carColors.length]
          ctx.fillStyle = carColor
          ctx.fillRect(ex + 2, ey + 9, ew - 4, CELL - 18)
        } else if (e.type === 'truck') {
          ctx.fillStyle = '#445566'
          ctx.fillRect(ex + 2, ey + 7, ew - 4, CELL - 14)
        } else if (e.type === 'log') {
          ctx.fillStyle = '#5c3a0d'
          ctx.fillRect(ex + 1, ey + 7, ew - 2, CELL - 14)
        } else if (e.type === 'turtle') {
          ctx.globalAlpha = e.submerged ? 0.28 : 1
          for (let t = 0; t < e.width; t++) {
            const tx = ex + t * CELL + CELL / 2
            const ty = ey + CELL / 2
            ctx.fillStyle = e.submerged ? '#1a4d1a' : '#2a8a2a'
            ctx.beginPath()
            ctx.arc(tx, ty, 14, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1
        }
      }
    }

    // Frog
    if (!gameEnded) {
      const flashOn = !dying || Math.floor(deathTimer / 80) % 2 === 0
      if (flashOn) {
        let drawCol: number
        let drawRow: number
        if (frog.animating) {
          const t = frog.animT / JUMP_MS
          drawCol = frog.col + (frog.targetCol - frog.col) * t
          drawRow = frog.row + (frog.targetRow - frog.row) * t
        } else {
          drawCol = frog.col
          drawRow = frog.row
        }

        const fx = (drawCol + 0.5) * CELL
        const fy = (drawRow + 0.5) * CELL
        const frogColor = dying ? '#ff4400' : '#00e64d'

        ctx.fillStyle = frogColor
        ctx.beginPath()
        ctx.ellipse(fx, fy, 14, 12, 0, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(fx - 6, fy - 5, 5, 0, Math.PI * 2)
        ctx.arc(fx + 6, fy - 5, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.arc(fx - 5, fy - 5, 2.5, 0, Math.PI * 2)
        ctx.arc(fx + 5, fy - 5, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, CANVAS_W, 35)

    // Time bar
    const maxT = roundTime(level)
    const ratio = Math.max(0, timer / maxT)
    const timerColor = ratio > 0.5 ? '#00cc44' : ratio > 0.25 ? '#ffcc00' : '#ff3300'
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_W, 5)
    ctx.fillStyle = timerColor
    ctx.fillRect(0, 0, CANVAS_W * ratio, 5)

    ctx.font = 'bold 13px monospace'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#00ff88'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE ${String(score).padStart(6, '0')}`, 8, 20)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(`LVL ${String(level).padStart(2, '0')}`, CANVAS_W / 2, 20)

    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(CANVAS_W - 20 - i * 22, 20, 7, 0, Math.PI * 2)
      ctx.fillStyle = i < lives ? '#00e64d' : '#333333'
      ctx.fill()
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (gameEnded) return
    const map: Record<string, Direction> = {
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    }
    const dir = map[e.key.toLowerCase()]
    if (!dir) return
    e.preventDefault()
    pendingDir = dir
  }

  document.addEventListener('keydown', handleKey)

  let rafId: number
  let lastTime = 0
  let pauseDrawn = false

  function loop(time: number) {
    if (!lastTime) lastTime = time
    const dt = Math.min(time - lastTime, 50)
    lastTime = time
    if (props.paused) {
      if (!pauseDrawn) {
        draw()
        pauseDrawn = true
      }
      rafId = requestAnimationFrame(loop)
      return
    }
    pauseDrawn = false
    update(dt)
    draw()
    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    document.removeEventListener('keydown', handleKey)
  })
})
</script>
