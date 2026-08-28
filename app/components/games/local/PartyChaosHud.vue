<script setup lang="ts">
const { players, round, config } = usePartyChaos()
</script>

<template>
  <div class="mb-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-4">
    <div class="mb-3 flex items-center justify-between text-sm">
      <span class="text-on-surface-variant">Ronda {{ round }} / {{ config.totalRounds }}</span>
      <span class="text-primary">🔥 Party Chaos</span>
    </div>
    <div class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="player in players"
        :key="player.id"
        class="flex items-center gap-3 rounded-xl px-3 py-2"
        :class="player.lives > 0 ? 'bg-surface-container-high' : 'bg-surface-container-high/40 opacity-50'"
      >
        <div class="flex-1 min-w-0">
          <p class="truncate font-medium text-on-surface">
            {{ player.name }}
          </p>
          <div class="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>🏆 {{ player.points }}</span>
            <span>🔥 {{ player.streak }}</span>
          </div>
        </div>
        <div class="flex gap-0.5">
          <MaterialIcon
            v-for="i in config.startingLives"
            :key="i"
            name="favorite"
            class="text-sm"
            :class="i <= player.lives ? 'text-error' : 'text-outline-variant/40'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
