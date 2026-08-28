<template>
  <div class="flex h-full w-full touch-none items-center justify-center">
    <canvas
      ref="canvasRef"
      :width="800"
      :height="600"
      class="block max-h-full max-w-full touch-none"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameProps } from '~/types/games'

const props = defineProps<GameProps>()
const canvasRef = ref<HTMLCanvasElement | null>(null)

type BlockColor = 'red' | 'yellow' | 'cyan' | 'magenta' | 'hotpink' | 'green' | 'gray'
type BlockDef = { col: number; row: number; color: string }
type Level = { speed: number; blocks: BlockDef[] }

onMounted(() => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!

  const W = 800
  const H = 600
  const PADDLE_SPEED = 400
  const BLOCK_COLS = 10
  const BLOCK_W = 64
  const BLOCK_H = 24
  const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2
  const BLOCKS_ORIGIN_Y = 80
  const BASE_BALL_VX = 200
  const BASE_BALL_VY = -300

  // Colors
  const COLORS: Record<BlockColor, string> = {
    red: '#e03030',
    yellow: '#e0c000',
    cyan: '#00c8d0',
    magenta: '#c040c0',
    hotpink: '#e050a0',
    green: '#28b040',
    gray: '#909090',
  }

  // Levels
  const LEVELS: Level[] = (() => {
    const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']
    const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green']
    const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red']

    const l1: BlockDef[] = []
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        l1.push({ col, row, color: rowColors1[row] })

    const l2: BlockDef[] = []
    const pyStart = [4, 3, 2, 1, 0, 0]
    const pyEnd = [5, 6, 7, 8, 9, 9]
    for (let row = 0; row < 6; row++)
      for (let col = pyStart[row]; col <= pyEnd[row]; col++)
        l2.push({ col, row, color: rowColors2[row] })

    const l3: BlockDef[] = []
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if ((col + row) % 2 === 0)
          l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' })

    const gaps4 = [
      [2, 5, 8],
      [0, 4, 7, 9],
      [1, 3, 6],
      [2, 5, 8, 9],
      [0, 4, 7],
      [1, 3, 6, 9],
    ]
    const l4: BlockDef[] = []
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++)
        if (!gaps4[row].includes(col))
          l4.push({ col, row, color: rowColors4[row] })

    const l5: BlockDef[] = []
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 10; col++) {
        const isFrame = col === 0 || col === 9 || row === 0 || row === 5
        const isCross = col === 4 || row === 2
        if (isFrame || isCross)
          l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' })
      }

    return [
      { speed: 1.0, blocks: l1 },
      { speed: 1.1, blocks: l2 },
      { speed: 1.21, blocks: l3 },
      { speed: 1.33, blocks: l4 },
      { speed: 1.46, blocks: l5 },
    ]
  })()

  type Block = {
    x: number
    y: number
    w: number
    h: number
    color: string
    alive: boolean
  }

  const paddle = { x: 0, y: 560, w: 81, h: 14 }
  const ball = {
    x: 0,
    y: 0,
    w: 16,
    h: 16,
    vx: BASE_BALL_VX,
    vy: BASE_BALL_VY,
  }

  let blocks: Block[] = []
  let lives = 3
  let score = 0
  let gameState: 'playing' | 'gameover' | 'win' = 'playing'
  let currentLevel = 1

  let reportedScore = 0
  let reportedLives = 3
  let reportedLevel = 1
  let gameOverFired = false

  const keys: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false,
  }

  function initPaddle() {
    paddle.x = (W - paddle.w) / 2
  }

  function initBall() {
    const speed = LEVELS[currentLevel - 1].speed
    ball.x = paddle.x + (paddle.w - ball.w) / 2
    ball.y = paddle.y - ball.h
    ball.vx = BASE_BALL_VX * speed
    ball.vy = BASE_BALL_VY * speed
  }

  function loadLevel(n: number) {
    currentLevel = n
    const level = LEVELS[n - 1]
    blocks = level.blocks.map(b => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }))
    ball.x = paddle.x + (paddle.w - ball.w) / 2
    ball.y = paddle.y - ball.h
    ball.vx = BASE_BALL_VX * level.speed
    ball.vy = BASE_BALL_VY * level.speed
  }

  function collideAABB(block: Block) {
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    )
  }

  function update(dt: number) {
    if (gameState !== 'playing') return

    if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt)
    if (keys.ArrowRight) paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt)

    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    if (ball.x <= 0) {
      ball.x = 0
      ball.vx = Math.abs(ball.vx)
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w
      ball.vx = -Math.abs(ball.vx)
    }
    if (ball.y <= 0) {
      ball.y = 0
      ball.vy = Math.abs(ball.vy)
    }

    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h
      ball.vy = -Math.abs(ball.vy)
    }

    for (const block of blocks) {
      if (!block.alive) continue
      if (collideAABB(block)) {
        block.alive = false
        score += 10
        ball.vy = -ball.vy
        if (blocks.every(b => !b.alive)) {
          if (currentLevel < 5) loadLevel(currentLevel + 1)
          else gameState = 'win'
        }
        break
      }
    }

    if (ball.y > H) {
      lives--
      if (lives <= 0) {
        lives = 0
        gameState = 'gameover'
      } else {
        initBall()
      }
    }

    if (score !== reportedScore) {
      reportedScore = score
      props.onScoreChange(score)
    }
    if (lives !== reportedLives) {
      reportedLives = lives
      props.onLivesChange(lives)
    }
    if (currentLevel !== reportedLevel) {
      reportedLevel = currentLevel
      props.onLevelChange(currentLevel)
    }

    if (!gameOverFired && (gameState === 'gameover' || gameState === 'win')) {
      gameOverFired = true
      props.onLivesChange(0)
      props.onGameOver(score)
    }
  }

  function draw() {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    for (const block of blocks) {
      if (!block.alive) continue
      ctx.fillStyle = COLORS[block.color as BlockColor] ?? '#888'
      ctx.fillRect(block.x, block.y, block.w, block.h)
    }

    // Paddle
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h)

    // Ball
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(ball.x, ball.y, ball.w, ball.h)

    // HUD
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Score: ' + score, 10, 10)
    ctx.textAlign = 'center'
    ctx.fillText('Nivel: ' + currentLevel, W / 2, 10)
    
    // Lives (balls)
    const ballSize = 16
    const ballSpacing = 4
    for (let i = 0; i < lives; i++) {
      const bx = W - 10 - (lives - i) * (ballSize + ballSpacing)
      ctx.fillRect(bx, 10, ballSize, ballSize)
    }
  }

  let rafId: number
  let lastTime: number | null = null
  let pauseDrawn = false

  function loop(timestamp: number) {
    if (lastTime === null) lastTime = timestamp
    const dt = (timestamp - lastTime) / 1000
    lastTime = timestamp

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

  function onKeyDown(e: KeyboardEvent) {
    if (e.key in keys) keys[e.key] = true
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key in keys) keys[e.key] = false
  }

  function movePaddleToClientX(clientX: number) {
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const pointerX = (clientX - rect.left) * scaleX
    paddle.x = Math.max(0, Math.min(W - paddle.w, pointerX - paddle.w / 2))
  }

  function onMouseMove(e: MouseEvent) {
    movePaddleToClientX(e.clientX)
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    movePaddleToClientX(touch.clientX)
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('touchstart', onTouchMove, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })

  initPaddle()
  loadLevel(1)
  rafId = requestAnimationFrame(loop)

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('touchstart', onTouchMove)
    canvas.removeEventListener('touchmove', onTouchMove)
  })
})
</script>
