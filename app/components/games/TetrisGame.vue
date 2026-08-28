<template>
  <div class="flex h-full w-full items-center justify-center gap-3">
    <canvas
      ref="boardRef"
      :width="300"
      :height="600"
      class="block max-h-full"
    />
    <canvas
      ref="nextRef"
      :width="120"
      :height="120"
      class="block max-h-full"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameProps } from '~/types/games'

const props = defineProps<GameProps>()

const boardRef = ref<HTMLCanvasElement | null>(null)
const nextRef = ref<HTMLCanvasElement | null>(null)

// Constants
const COLS = 10
const ROWS = 20
const BLOCK = 30

// Tetromino shapes
const PIECES: (number[][] | null)[] = [
  null,
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [2, 2],
    [2, 2],
  ],
  // T
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // S
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  // J
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
]

const LINE_SCORES = [0, 100, 300, 500, 800]

// Retro colors
const COLORS = [
  null,
  '#4dd0e1', // cyan
  '#ffd54f', // yellow
  '#ba68c8', // magenta
  '#81c784', // green
  '#e57373', // red
  '#90caf9', // blue
  '#ffb74d', // orange
]

type Piece = { type: number; shape: number[][]; x: number; y: number }

onMounted(() => {
  if (!boardRef.value || !nextRef.value) return

  const boardCanvas = boardRef.value
  const boardCtx = boardCanvas.getContext('2d')!
  const nextCanvas = nextRef.value
  const nextCtx = nextCanvas.getContext('2d')!

  let board: number[][]
  let current: Piece
  let next: Piece
  let score = 0
  let lines = 0
  let level = 1
  let dropInterval = 1000
  let dropAccum = 0
  let lastTime = performance.now()
  let animId: number
  let gameOver = false
  let gameOverFired = false
  let prevScore = 0
  let prevLevel = 1

  function createBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
  }

  function randomPiece(): Piece {
    const type = Math.floor(Math.random() * 7) + 1
    const shape = (PIECES[type] as number[][]).map(row => [...row])
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    }
  }

  function collide(shape: number[][], ox: number, oy: number) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const nx = ox + c
        const ny = oy + r
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true
        if (ny >= 0 && board[ny][nx]) return true
      }
    }
    return false
  }

  function rotateCW(shape: number[][]): number[][] {
    const rows = shape.length
    const cols = shape[0].length
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0))
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c]
    return result
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape)
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated
        current.x += kick
        return
      }
    }
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          board[current.y + r][current.x + c] = current.shape[r][c]
  }

  function clearLines() {
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(v => v !== 0)) {
        board.splice(r, 1)
        board.unshift(new Array(COLS).fill(0))
        cleared++
        r++
      }
    }
    if (cleared) {
      lines += cleared
      score += (LINE_SCORES[cleared] ?? 0) * level
      level = Math.floor(lines / 10) + 1
      dropInterval = Math.max(100, 1000 - (level - 1) * 90)
    }
  }

  function ghostY() {
    let gy = current.y
    while (!collide(current.shape, current.x, gy + 1)) gy++
    return gy
  }

  function hardDrop() {
    const gy = ghostY()
    score += (gy - current.y) * 2
    current.y = gy
    lockPiece()
  }

  function softDrop() {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++
      score += 1
    } else {
      lockPiece()
    }
  }

  function endGame() {
    gameOver = true
  }

  function drawNext() {
    const NB = 30
    nextCtx.fillStyle = '#0a0a0f'
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height)
    
    const shape = next.shape
    const offX = Math.floor((4 - shape[0].length) / 2)
    const offY = Math.floor((4 - shape.length) / 2)
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        const ci = shape[r][c]
        if (!ci) continue
        nextCtx.fillStyle = COLORS[ci] as string
        nextCtx.fillRect((offX + c) * NB + 1, (offY + r) * NB + 1, NB - 2, NB - 2)
        // Highlight
        nextCtx.fillStyle = 'rgba(255,255,255,0.12)'
        nextCtx.fillRect((offX + c) * NB + 1, (offY + r) * NB + 1, NB - 2, 4)
      }
    }
  }

  function spawn() {
    current = next
    next = randomPiece()
    if (collide(current.shape, current.x, current.y)) {
      endGame()
      return
    }
    drawNext()
  }

  function lockPiece() {
    merge()
    clearLines()
    spawn()
  }

  function drawGrid() {
    boardCtx.strokeStyle = 'rgba(255,255,255,0.08)'
    boardCtx.lineWidth = 0.5
    for (let c = 1; c < COLS; c++) {
      boardCtx.beginPath()
      boardCtx.moveTo(c * BLOCK, 0)
      boardCtx.lineTo(c * BLOCK, ROWS * BLOCK)
      boardCtx.stroke()
    }
    for (let r = 1; r < ROWS; r++) {
      boardCtx.beginPath()
      boardCtx.moveTo(0, r * BLOCK)
      boardCtx.lineTo(COLS * BLOCK, r * BLOCK)
      boardCtx.stroke()
    }
  }

  function drawHUD() {
    boardCtx.fillStyle = 'rgba(255,255,255,0.75)'
    boardCtx.font = 'bold 11px monospace'
    boardCtx.textAlign = 'left'
    boardCtx.fillText(`SCORE ${score.toLocaleString()}`, 4, 13)
    boardCtx.fillText(`LINES ${lines}`, 4, 27)
    boardCtx.fillText(`LEVEL ${level}`, 4, 41)
  }

  function draw() {
    boardCtx.fillStyle = '#0a0a0f'
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height)
    drawGrid()

    // Board blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ci = board[r][c]
        if (!ci) continue
        boardCtx.fillStyle = COLORS[ci] as string
        boardCtx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2)
        // Highlight
        boardCtx.fillStyle = 'rgba(255,255,255,0.12)'
        boardCtx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, 4)
      }
    }

    if (!gameOver) {
      // Ghost piece
      const gy = ghostY()
      for (let r = 0; r < current.shape.length; r++) {
        for (let c = 0; c < current.shape[r].length; c++) {
          const ci = current.shape[r][c]
          if (!ci) continue
          boardCtx.globalAlpha = 0.2
          boardCtx.fillStyle = COLORS[ci] as string
          boardCtx.fillRect((current.x + c) * BLOCK + 1, (gy + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2)
          boardCtx.globalAlpha = 1
        }
      }

      // Current piece
      for (let r = 0; r < current.shape.length; r++) {
        for (let c = 0; c < current.shape[r].length; c++) {
          const ci = current.shape[r][c]
          if (!ci) continue
          boardCtx.fillStyle = COLORS[ci] as string
          boardCtx.fillRect((current.x + c) * BLOCK + 1, (current.y + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2)
          // Highlight
          boardCtx.fillStyle = 'rgba(255,255,255,0.12)'
          boardCtx.fillRect((current.x + c) * BLOCK + 1, (current.y + r) * BLOCK + 1, BLOCK - 2, 4)
        }
      }
    }

    drawHUD()
  }

  function init() {
    board = createBoard()
    score = 0
    lines = 0
    level = 1
    dropInterval = 1000
    dropAccum = 0
    gameOver = false
    gameOverFired = false
    prevScore = -1
    prevLevel = -1
    lastTime = performance.now()
    next = randomPiece()
    spawn()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (props.paused || gameOver) return
    switch (e.code) {
      case 'ArrowLeft':
        if (!collide(current.shape, current.x - 1, current.y)) current.x--
        break
      case 'ArrowRight':
        if (!collide(current.shape, current.x + 1, current.y)) current.x++
        break
      case 'ArrowDown':
        softDrop()
        break
      case 'ArrowUp':
      case 'KeyX':
        tryRotate()
        break
      case 'Space':
        e.preventDefault()
        hardDrop()
        break
    }
  }

  let pauseDrawn = false

  function loop(ts: number) {
    const dt = Math.min(ts - lastTime, 100)
    lastTime = ts

    if (props.paused) {
      if (!pauseDrawn) {
        draw()
        pauseDrawn = true
      }
      animId = requestAnimationFrame(loop)
      return
    }
    pauseDrawn = false

    if (!gameOver) {
      dropAccum += dt
      if (dropAccum >= dropInterval) {
        dropAccum = 0
        if (!collide(current.shape, current.x, current.y + 1)) {
          current.y++
        } else {
          lockPiece()
        }
      }
    }

    draw()

    if (score !== prevScore) {
      props.onScoreChange(score)
      prevScore = score
    }
    if (level !== prevLevel) {
      props.onLevelChange(level)
      prevLevel = level
    }
    if (gameOver && !gameOverFired) {
      gameOverFired = true
      props.onLivesChange(0)
      props.onGameOver(score)
    }

    animId = requestAnimationFrame(loop)
  }

  document.addEventListener('keydown', onKeyDown)
  init()
  animId = requestAnimationFrame(loop)

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    document.removeEventListener('keydown', onKeyDown)
  })
})
</script>
