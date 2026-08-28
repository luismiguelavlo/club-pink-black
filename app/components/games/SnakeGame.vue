<template>
  <div class="flex h-full w-full items-center justify-center">
    <canvas
      ref="canvasRef"
      :width="800"
      :height="800"
      class="block max-h-full max-w-full"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameProps } from '~/types/games'

const props = defineProps<GameProps>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Constants
const COLS = 20
const ROWS = 20
const CELL = 40
const W = COLS * CELL
const H = ROWS * CELL
const BASE_MS = 150
const SPEED_REDUCTION = 10
const FRUITS_PER_LEVEL = 5

// Fruit sprites definition
const FRUIT_SPRITES = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  { x: 378, y: 136, w: 110, h: 160 }, // grape
  { x: 540, y: 136, w: 130, h: 160 }, // garlic
  { x: 712, y: 136, w: 130, h: 160 }, // eggplant
  { x: 894, y: 136, w: 110, h: 160 }, // strawberry
  { x: 1066, y: 136, w: 110, h: 160 }, // cherry
  { x: 1228, y: 136, w: 130, h: 160 }, // carrot
  { x: 1400, y: 136, w: 130, h: 160 }, // mushroom
  { x: 1582, y: 136, w: 110, h: 160 }, // broccoli
  { x: 1734, y: 136, w: 150, h: 160 }, // watermelon
  { x: 1906, y: 136, w: 150, h: 160 }, // pepper
  { x: 2068, y: 136, w: 170, h: 160 }, // kiwi
  { x: 2250, y: 136, w: 140, h: 160 }, // lemon
  { x: 2432, y: 136, w: 130, h: 160 }, // peach
  { x: 2604, y: 136, w: 130, h: 160 }, // peanut
  { x: 2786, y: 136, w: 110, h: 160 }, // apple
  { x: 2948, y: 136, w: 130, h: 160 }, // tomato
  { x: 3110, y: 136, w: 150, h: 160 }, // berries
  { x: 3302, y: 136, w: 110, h: 160 }, // grapes2
  { x: 3454, y: 136, w: 150, h: 160 }, // pineapple
  { x: 3637, y: 136, w: 130, h: 160 }, // melon
]

// Skin system
const SKINS = {
  classic: {
    name: 'Classic',
    boardBg: '#0a1a0a',
    gridColor: 'rgba(0,255,80,0.06)',
    headColor: '#00ff50',
    bodyColor: '#00cc40',
    eyeColor: '#001a00',
    hudBg: 'rgba(0,0,0,0.55)',
    hudPrimaryColor: '#00ff80',
    hudSecondaryColor: '#80ffcc',
  },
}

type Point = { x: number; y: number }

interface GameState {
  snake: Point[]
  dir: Point
  nextDir: Point
  fruit: { pos: Point; spriteIdx: number }
  score: number
  level: number
  fruitsEaten: number
  dead: boolean
}

function randomFruit(snake: Point[]): { pos: Point; spriteIdx: number } {
  let pos: Point
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return { pos, spriteIdx: Math.floor(Math.random() * FRUIT_SPRITES.length) }
}

function initialState(): GameState {
  const snake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]
  const dir = { x: 1, y: 0 }
  return {
    snake,
    dir,
    nextDir: dir,
    fruit: randomFruit(snake),
    score: 0,
    level: 1,
    fruitsEaten: 0,
    dead: false,
  }
}

function intervalMs(level: number): number {
  return Math.max(50, BASE_MS - (level - 1) * SPEED_REDUCTION)
}

onMounted(() => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!

  let alive = true
  const state = initialState()
  const skin = SKINS.classic
  let intervalId: ReturnType<typeof setInterval> | null = null
  let prevScore = 0
  let prevLevel = 1
  let deadFired = false
  let pauseDrawn = false

  const draw = () => {
    // Background
    ctx.fillStyle = skin.boardBg
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = skin.gridColor
    ctx.lineWidth = 1
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(c * CELL, 0)
      ctx.lineTo(c * CELL, H)
      ctx.stroke()
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * CELL)
      ctx.lineTo(W, r * CELL)
      ctx.stroke()
    }

    // Snake body
    state.snake.forEach((seg, i) => {
      const isHead = i === 0
      const alpha = isHead ? 1 : Math.max(0.4, 1 - i * 0.03)
      ctx.globalAlpha = alpha
      ctx.fillStyle = isHead ? skin.headColor : skin.bodyColor
      const pad = isHead ? 2 : 4
      ctx.beginPath()
      ctx.roundRect?.(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        isHead ? 6 : 4,
      )
      ctx.fill()
      ctx.globalAlpha = 1

      // Head eyes
      if (isHead) {
        ctx.fillStyle = skin.eyeColor
        const d = state.dir
        const ex = seg.x * CELL + CELL / 2 + d.x * 8
        const ey = seg.y * CELL + CELL / 2 + d.y * 8
        const ox = d.y * 7
        const oy = d.x * 7
        ctx.beginPath()
        ctx.arc(ex + ox, ey - oy, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(ex - ox, ey + oy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Fruit - simple circle placeholder (sin necesidad de imagen)
    const fx = state.fruit.pos.x * CELL + CELL / 2
    const fy = state.fruit.pos.y * CELL + CELL / 2
    const fruitColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff']
    ctx.fillStyle = fruitColors[state.fruit.spriteIdx % fruitColors.length]
    ctx.beginPath()
    ctx.arc(fx, fy, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // HUD overlay
    ctx.fillStyle = skin.hudBg
    ctx.fillRect(0, 0, W, 38)

    ctx.font = 'bold 14px monospace'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = skin.hudPrimaryColor
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE  ${String(state.score).padStart(6, '0')}`, 12, 19)

    ctx.fillStyle = skin.hudSecondaryColor
    ctx.textAlign = 'right'
    ctx.fillText(`LEVEL  ${String(state.level).padStart(2, '0')}`, W - 12, 19)

    ctx.textAlign = 'left'
  }

  const update = () => {
    if (state.dead) return

    state.dir = state.nextDir
    const head = state.snake[0]
    const newHead: Point = { x: head.x + state.dir.x, y: head.y + state.dir.y }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      triggerDeath()
      return
    }

    // Self collision
    if (state.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      triggerDeath()
      return
    }

    const ateFruit = newHead.x === state.fruit.pos.x && newHead.y === state.fruit.pos.y

    // Move snake
    state.snake.unshift(newHead)
    if (!ateFruit) {
      state.snake.pop()
    } else {
      state.fruitsEaten += 1
      state.score += 10 * state.level

      const prevLevel = state.level
      if (state.fruitsEaten % FRUITS_PER_LEVEL === 0) {
        state.level += 1
        reschedule()
      }

      state.fruit = randomFruit(state.snake)

      // Fire callbacks only when values change
      if (state.score !== prevScore) {
        prevScore = state.score
        props.onScoreChange(state.score)
      }
      if (state.level !== prevLevel) {
        prevLevel = state.level
        props.onLevelChange(state.level)
      }
    }
  }

  function triggerDeath() {
    if (deadFired) return
    deadFired = true
    state.dead = true
    if (intervalId) clearInterval(intervalId)
    draw()
    props.onLivesChange(0)
    props.onGameOver(state.score)
  }

  function tick() {
    if (props.paused) {
      if (!pauseDrawn) {
        draw()
        pauseDrawn = true
      }
      return
    }
    pauseDrawn = false
    update()
    draw()
  }

  function startLoop() {
    if (intervalId) clearInterval(intervalId)
    intervalId = setInterval(tick, intervalMs(state.level))
  }

  function reschedule() {
    if (intervalId) clearInterval(intervalId)
    intervalId = setInterval(tick, intervalMs(state.level))
  }

  function handleKey(e: KeyboardEvent) {
    const cur = state.dir
    const map: Record<string, Point> = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 },
    }
    const next = map[e.key.toLowerCase()]
    if (!next) return
    e.preventDefault()
    // Ignore 180° reversal
    if (next.x === -cur.x && next.y === -cur.y) return
    state.nextDir = next
  }

  document.addEventListener('keydown', handleKey)
  
  // Start the loop immediately without waiting for image
  startLoop()

  onUnmounted(() => {
    alive = false
    if (intervalId) clearInterval(intervalId)
    document.removeEventListener('keydown', handleKey)
  })
})
</script>
