<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'
import {
  AH_FIELD_H,
  AH_FIELD_W,
  AH_GOAL_HALF_WIDTH,
  AH_MALLET_RADIUS,
  AH_PUCK_RADIUS,
} from '#shared/utils/air-hockey-physics'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  action: [action: { type: 'move_mallet'; x: number; y: number }]
}>()

const P1_COLOR = '#ff4d94'
const P2_COLOR = '#38e0e0'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const keys = new Set<string>()

const display = reactive({
  bottomX: AH_FIELD_W / 2,
  bottomY: AH_FIELD_H - 110,
  topX: AH_FIELD_W / 2,
  topY: 110,
  puckX: AH_FIELD_W / 2,
  puckY: AH_FIELD_H / 2,
})

let raf: number | null = null
let lastSend = 0
let lastFrame = 0

const players = computed(() => props.room.players)
const bottomPlayer = computed(() => players.value[0])
const topPlayer = computed(() => players.value[1])
const mySide = computed<'bottom' | 'top' | null>(() => {
  const me = props.room.me?.userId
  if (!me) return null
  if (bottomPlayer.value?.userId === me) return 'bottom'
  if (topPlayer.value?.userId === me) return 'top'
  return null
})
const flipView = computed(() => mySide.value === 'top')
const canPlay = computed(() =>
  (props.room.phase === 'air_hockey_playing' || props.room.phase === 'air_hockey_goal')
  && mySide.value
  && !props.room.me?.waiting,
)

function syncFromServer() {
  const bottom = bottomPlayer.value
  const top = topPlayer.value
  if (bottom) {
    display.bottomX = bottom.x
    display.bottomY = bottom.y
  }
  if (top) {
    display.topX = top.x
    display.topY = top.y
  }
  display.puckX = props.room.puckX ?? AH_FIELD_W / 2
  display.puckY = props.room.puckY ?? AH_FIELD_H / 2
}

function lerpDisplay(dt: number) {
  const t = Math.min(1, dt * 12)
  const bottom = bottomPlayer.value
  const top = topPlayer.value
  if (bottom) {
    display.bottomX += (bottom.x - display.bottomX) * t
    display.bottomY += (bottom.y - display.bottomY) * t
  }
  if (top) {
    display.topX += (top.x - display.topX) * t
    display.topY += (top.y - display.topY) * t
  }
  display.puckX += ((props.room.puckX ?? display.puckX) - display.puckX) * t
  display.puckY += ((props.room.puckY ?? display.puckY) - display.puckY) * t
}

function sendMallet(x: number, y: number) {
  const now = Date.now()
  if (now - lastSend < 50) return
  lastSend = now
  emit('action', { type: 'move_mallet', x, y })
}

function pointerToField(event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  let x = ((event.clientX - rect.left) / rect.width) * AH_FIELD_W
  let y = ((event.clientY - rect.top) / rect.height) * AH_FIELD_H
  if (flipView.value) {
    x = AH_FIELD_W - x
    y = AH_FIELD_H - y
  }
  return { x, y }
}

function onPointerDown(event: PointerEvent) {
  if (!canPlay.value || !mySide.value) return
  const pos = pointerToField(event)
  if (!pos) return
  event.preventDefault()
  sendMallet(pos.x, pos.y)
  try { canvasRef.value?.setPointerCapture(event.pointerId) } catch { /* noop */ }
}

function onPointerMove(event: PointerEvent) {
  if (!canPlay.value || !mySide.value) return
  const pos = pointerToField(event)
  if (!pos) return
  event.preventDefault()
  sendMallet(pos.x, pos.y)
}

function drawTable(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, AH_FIELD_H)
  gradient.addColorStop(0, '#101018')
  gradient.addColorStop(0.5, '#17131d')
  gradient.addColorStop(1, '#101018')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, AH_FIELD_W, AH_FIELD_H)

  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, AH_FIELD_H / 2)
  ctx.lineTo(AH_FIELD_W, AH_FIELD_H / 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(AH_FIELD_W / 2, AH_FIELD_H / 2, 72, 0, Math.PI * 2)
  ctx.stroke()

  for (const [atTop, color] of [[true, P2_COLOR], [false, P1_COLOR]] as const) {
    ctx.strokeStyle = atTop ? 'rgba(56,224,224,0.28)' : 'rgba(255,77,148,0.28)'
    ctx.beginPath()
    ctx.arc(
      AH_FIELD_W / 2,
      atTop ? 0 : AH_FIELD_H,
      AH_GOAL_HALF_WIDTH + 34,
      atTop ? 0 : Math.PI,
      atTop ? Math.PI : Math.PI * 2,
    )
    ctx.stroke()
    ctx.fillStyle = color
    ctx.fillRect(
      AH_FIELD_W / 2 - AH_GOAL_HALF_WIDTH,
      atTop ? 0 : AH_FIELD_H - 10,
      AH_GOAL_HALF_WIDTH * 2,
      10,
    )
  }
}

function drawMallet(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.beginPath()
  ctx.arc(x, y, AH_MALLET_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, AH_MALLET_RADIUS * 0.58, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(10,10,14,0.85)'
  ctx.fill()
  ctx.restore()
}

function drawPuck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 22
  ctx.beginPath()
  ctx.arc(x, y, AH_PUCK_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = '#f4f4f8'
  ctx.fill()
  ctx.restore()
}

function draw(ctx: CanvasRenderingContext2D) {
  ctx.save()
  if (flipView.value) {
    ctx.translate(AH_FIELD_W, AH_FIELD_H)
    ctx.rotate(Math.PI)
  }

  drawTable(ctx)
  drawMallet(ctx, display.topX, display.topY, P2_COLOR)
  drawMallet(ctx, display.bottomX, display.bottomY, P1_COLOR)
  drawPuck(ctx, display.puckX, display.puckY)

  ctx.restore()
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return
  const dt = Math.min((now - lastFrame) / 1000, 1 / 30) || 1 / 60
  lastFrame = now
  lerpDisplay(dt)
  draw(ctx)
}

function updateKeyboardMallet() {
  if (!canPlay.value || !mySide.value) return
  const speed = 8
  let x = mySide.value === 'bottom' ? display.bottomX : display.topX
  let y = mySide.value === 'bottom' ? display.bottomY : display.topY

  if (mySide.value === 'bottom') {
    if (keys.has('arrowleft') || keys.has('a')) x -= speed
    if (keys.has('arrowright') || keys.has('d')) x += speed
    if (keys.has('arrowup') || keys.has('w')) y -= speed
    if (keys.has('arrowdown') || keys.has('s')) y += speed
  }
  else {
    if (keys.has('arrowleft') || keys.has('a')) x -= speed
    if (keys.has('arrowright') || keys.has('d')) x += speed
    if (keys.has('arrowup') || keys.has('w')) y -= speed
    if (keys.has('arrowdown') || keys.has('s')) y += speed
  }

  sendMallet(x, y)
}

const TRACKED_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'])

function onKeyDown(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  if (!TRACKED_KEYS.has(key)) return
  event.preventDefault()
  keys.add(key)
  updateKeyboardMallet()
}

function onKeyUp(event: KeyboardEvent) {
  keys.delete(event.key.toLowerCase())
}

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = AH_FIELD_W * dpr
  canvas.height = AH_FIELD_H * dpr
  canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

watch(() => props.room.updatedAt, () => {
  syncFromServer()
}, { immediate: true })

onMounted(() => {
  setupCanvas()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  lastFrame = performance.now()
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  if (raf !== null) cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3 text-sm">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: P2_COLOR }" />
        <span class="text-on-surface-variant">{{ topPlayer?.name ?? 'Jugador 2' }}</span>
        <span class="font-headline-lg text-lg" :style="{ color: P2_COLOR }">{{ room.hockeyScoreTop ?? 0 }}</span>
      </div>
      <span class="text-xs text-on-surface-variant">
        Meta {{ room.hockeyTargetScore ?? 5 }}
      </span>
      <div class="flex items-center gap-2">
        <span class="font-headline-lg text-lg" :style="{ color: P1_COLOR }">{{ room.hockeyScoreBottom ?? 0 }}</span>
        <span class="text-on-surface-variant">{{ bottomPlayer?.name ?? 'Jugador 1' }}</span>
        <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: P1_COLOR }" />
      </div>
    </div>

    <div
      v-if="room.message"
      class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-on-surface"
      :class="{ 'animate-pulse': room.phase === 'air_hockey_goal' }"
    >
      {{ room.message }}
    </div>

    <div
      class="relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-black"
      style="max-width: min(440px, 92vw); margin: 0 auto"
    >
      <canvas
        ref="canvasRef"
        class="block w-full touch-none select-none"
        style="aspect-ratio: 4 / 7"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
      />

      <div
        v-if="room.phase === 'air_hockey_goal'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="rounded-2xl bg-black/70 px-6 py-4 text-center backdrop-blur-sm">
          <p class="font-headline-lg text-3xl text-primary">
            ¡GOL!
          </p>
        </div>
      </div>

      <div
        v-if="room.status === 'finished'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center backdrop-blur-sm"
      >
        <p class="text-5xl">
          🏆
        </p>
        <h3 class="font-headline-lg text-2xl text-primary">
          Gana {{ room.winnerName }}
        </h3>
        <p class="text-on-surface">
          {{ room.hockeyScoreBottom ?? 0 }} - {{ room.hockeyScoreTop ?? 0 }}
        </p>
      </div>
    </div>

    <p class="text-center text-xs text-on-surface-variant">
      <template v-if="mySide">
        Arrastra en tu mitad de la pantalla para mover el mazo. Tu vista siempre te pone abajo.
      </template>
      <template v-else>
        Estás viendo la partida en curso.
      </template>
    </p>
  </div>
</template>
