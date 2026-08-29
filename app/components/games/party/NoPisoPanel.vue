<script setup lang="ts">
import type { PartyRoomView } from '#shared/types/party-games'

const props = defineProps<{
  room: PartyRoomView
}>()

const emit = defineEmits<{
  action: [action: { type: 'move'; direction: 'left' | 'right' } | { type: 'jump' }]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const W = 800
const H = 600

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#0a0a12'
  ctx.fillRect(0, 0, W, H)

  // Lava
  const lavaGrad = ctx.createLinearGradient(0, 520, 0, H)
  lavaGrad.addColorStop(0, '#ff4500')
  lavaGrad.addColorStop(1, '#8b0000')
  ctx.fillStyle = lavaGrad
  ctx.fillRect(0, 540, W, 60)
  ctx.font = '20px sans-serif'
  ctx.fillText('🌋🌋🌋', W / 2 - 40, 575)

  for (const platform of props.room.platforms) {
    if (!platform.solid && !platform.warning) continue
    ctx.fillStyle = platform.warning ? '#ff6b6b88' : platform.id === 0 ? '#444' : '#4dd0e1'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    if (platform.warning) {
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 2
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
    }
  }

  for (const player of props.room.players) {
    if (!player.alive) continue
    ctx.fillStyle = player.color
    ctx.fillRect(player.x, player.y, 28, 36)
    ctx.fillStyle = '#000'
    ctx.font = '10px sans-serif'
    ctx.fillText(player.name.slice(0, 6), player.x, player.y - 4)
  }
}

watch(() => props.room, draw, { deep: true })

onMounted(() => {
  draw()
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  if (props.room.phase !== 'no_piso_playing' && props.room.phase !== 'no_piso_warning') return
  if (!props.room.me?.alive) return

  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    emit('action', { type: 'move', direction: 'left' })
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    emit('action', { type: 'move', direction: 'right' })
  }
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault()
    emit('action', { type: 'jump' })
  }
}

const countdown = computed(() => {
  if (props.room.phase !== 'no_piso_warning' || !props.room.floorCollapseAt) return null
  return Math.max(0, Math.ceil((props.room.floorCollapseAt - Date.now()) / 1000))
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="room.message"
      class="rounded-xl border px-4 py-3 text-center"
      :class="room.phase === 'no_piso_warning' ? 'animate-pulse border-error bg-error/20 text-error' : 'border-primary/30 bg-primary/10 text-on-surface'"
    >
      {{ room.message }}
      <span v-if="countdown !== null"> ({{ countdown }}s)</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-outline-variant/20 bg-black">
      <canvas
        ref="canvasRef"
        :width="W"
        :height="H"
        class="block w-full"
      />
    </div>

    <div class="flex justify-center gap-4 md:hidden">
      <button
        type="button"
        class="rounded-xl bg-surface-container-high px-6 py-3"
        @click="emit('action', { type: 'move', direction: 'left' })"
      >
        ←
      </button>
      <button
        type="button"
        class="rounded-xl bg-primary px-6 py-3 text-on-primary"
        @click="emit('action', { type: 'jump' })"
      >
        Saltar
      </button>
      <button
        type="button"
        class="rounded-xl bg-surface-container-high px-6 py-3"
        @click="emit('action', { type: 'move', direction: 'right' })"
      >
        →
      </button>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="player in room.players"
        :key="player.userId"
        class="flex items-center gap-2 rounded-xl px-3 py-2"
        :class="player.alive ? 'bg-surface-container-high' : 'bg-surface-container-high/40 opacity-50'"
      >
        <span
          class="h-3 w-3 rounded-full"
          :style="{ backgroundColor: player.color }"
        />
        <span>{{ player.name }}</span>
        <span class="ml-auto text-sm">{{ player.alive ? '✓' : '💀' }}</span>
      </div>
    </div>

    <div
      v-if="room.phase === 'finished'"
      class="rounded-xl bg-primary/10 p-4 text-center text-xl"
    >
      🏆 {{ room.winnerName }} gana
    </div>
  </div>
</template>
