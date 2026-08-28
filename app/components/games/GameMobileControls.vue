<script setup lang="ts">
import { pressGameKey, releaseGameKey, tapGameKey } from '~/composables/useVirtualGamepad'

export type MobileControlLayout = 'dpad' | 'tetris' | 'asteroids' | 'paddle'

defineProps<{
  layout: MobileControlLayout
}>()

let lastTouchTapAt = 0

function hold(code: string, e: TouchEvent | MouseEvent) {
  e.preventDefault()
  pressGameKey(code)
}

function unhold(code: string, e: TouchEvent | MouseEvent) {
  e.preventDefault()
  releaseGameKey(code)
}

function tap(code: string, e: TouchEvent | MouseEvent) {
  e.preventDefault()

  if (e.type === 'click' && Date.now() - lastTouchTapAt < 500) {
    return
  }

  if (e.type === 'touchstart') {
    lastTouchTapAt = Date.now()
  }

  tapGameKey(code)
}

function stopContext(e: Event) {
  e.preventDefault()
}
</script>

<template>
  <div
    class="select-none touch-none rounded-2xl border border-outline-variant/20 bg-surface-container-low/50 p-3"
    @contextmenu="stopContext"
  >
    <p class="mb-3 text-center text-xs text-on-surface-variant lg:hidden">
      Controles táctiles
    </p>

    <!-- Snake / Frogger -->
    <div
      v-if="layout === 'dpad'"
      class="mx-auto grid max-w-[220px] grid-cols-3 grid-rows-3 gap-2"
    >
      <div />
      <button
        type="button"
        class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
        @touchstart.stop="tap('ArrowUp', $event)"
        @click.stop="tap('ArrowUp', $event)"
      >
        ↑
      </button>
      <div />
      <button
        type="button"
        class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
        @touchstart.stop="tap('ArrowLeft', $event)"
        @click.stop="tap('ArrowLeft', $event)"
      >
        ←
      </button>
      <button
        type="button"
        class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
        @touchstart.stop="tap('ArrowDown', $event)"
        @click.stop="tap('ArrowDown', $event)"
      >
        ↓
      </button>
      <button
        type="button"
        class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
        @touchstart.stop="tap('ArrowRight', $event)"
        @click.stop="tap('ArrowRight', $event)"
      >
        →
      </button>
    </div>

    <!-- Tetris -->
    <div
      v-else-if="layout === 'tetris'"
      class="space-y-2"
    >
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-xl active:bg-primary/30"
          @touchstart.stop="tap('ArrowLeft', $event)"
          @click.stop="tap('ArrowLeft', $event)"
        >
          ←
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-primary/20 text-xl active:bg-primary/40"
          @touchstart.stop="tap('ArrowUp', $event)"
          @click.stop="tap('ArrowUp', $event)"
        >
          ↻
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-xl active:bg-primary/30"
          @touchstart.stop="tap('ArrowRight', $event)"
          @click.stop="tap('ArrowRight', $event)"
        >
          →
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-sm active:bg-primary/30"
          @touchstart.stop="tap('ArrowDown', $event)"
          @click.stop="tap('ArrowDown', $event)"
        >
          Bajar ↓
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-primary/20 text-sm font-medium active:bg-primary/40"
          @touchstart.stop="tap('Space', $event)"
          @click.stop="tap('Space', $event)"
        >
          Caída ⬇⬇
        </button>
      </div>
    </div>

    <!-- Asteroids -->
    <div
      v-else-if="layout === 'asteroids'"
      class="space-y-3"
    >
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-xl active:bg-primary/30"
          @touchstart="hold('ArrowLeft', $event)"
          @touchend="unhold('ArrowLeft', $event)"
          @touchcancel="unhold('ArrowLeft', $event)"
          @mousedown="hold('ArrowLeft', $event)"
          @mouseup="unhold('ArrowLeft', $event)"
          @mouseleave="unhold('ArrowLeft', $event)"
        >
          ↺
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-primary/20 text-xl active:bg-primary/40"
          @touchstart="hold('ArrowUp', $event)"
          @touchend="unhold('ArrowUp', $event)"
          @touchcancel="unhold('ArrowUp', $event)"
          @mousedown="hold('ArrowUp', $event)"
          @mouseup="unhold('ArrowUp', $event)"
          @mouseleave="unhold('ArrowUp', $event)"
        >
          🚀
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-xl active:bg-primary/30"
          @touchstart="hold('ArrowRight', $event)"
          @touchend="unhold('ArrowRight', $event)"
          @touchcancel="unhold('ArrowRight', $event)"
          @mousedown="hold('ArrowRight', $event)"
          @mouseup="unhold('ArrowRight', $event)"
          @mouseleave="unhold('ArrowRight', $event)"
        >
          ↻
        </button>
      </div>
      <button
        type="button"
        class="flex h-16 w-full items-center justify-center rounded-xl bg-error/20 text-lg font-medium active:bg-error/40"
        @touchstart.stop="tap('Space', $event)"
        @click.stop="tap('Space', $event)"
      >
        💥 Disparar
      </button>
    </div>

    <!-- Arkanoid -->
    <div
      v-else-if="layout === 'paddle'"
      class="space-y-3"
    >
      <p class="text-center text-xs text-on-surface-variant">
        Arrastra el dedo sobre el juego para mover la paleta
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
          @touchstart="hold('ArrowLeft', $event)"
          @touchend="unhold('ArrowLeft', $event)"
          @touchcancel="unhold('ArrowLeft', $event)"
          @mousedown="hold('ArrowLeft', $event)"
          @mouseup="unhold('ArrowLeft', $event)"
          @mouseleave="unhold('ArrowLeft', $event)"
        >
          ←
        </button>
        <button
          type="button"
          class="flex h-14 items-center justify-center rounded-xl bg-surface-container-high text-2xl active:bg-primary/30"
          @touchstart="hold('ArrowRight', $event)"
          @touchend="unhold('ArrowRight', $event)"
          @touchcancel="unhold('ArrowRight', $event)"
          @mousedown="hold('ArrowRight', $event)"
          @mouseup="unhold('ArrowRight', $event)"
          @mouseleave="unhold('ArrowRight', $event)"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.touch-none {
  touch-action: none;
}
</style>
