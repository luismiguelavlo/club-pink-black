<script setup lang="ts">
import type { StatItem } from '~/types/site'
import { clubLogo, clubStats } from '~/data/site'

const props = withDefaults(
  defineProps<{
    stats?: StatItem[]
    logoSrc?: string
    logoAlt?: string
  }>(),
  {
    stats: () => clubStats,
    logoSrc: clubLogo.src,
    logoAlt: clubLogo.alt,
  },
)

const leftStats = computed(() => props.stats.filter((stat) => stat.align === 'right'))
const rightStats = computed(() => props.stats.filter((stat) => stat.align === 'left'))
</script>

<template>
  <section
    id="philosophy"
    class="relative px-gutter-mobile py-section-gap md:px-gutter-desktop"
  >
    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
        <div class="order-2 flex flex-col justify-center space-y-8 md:order-1">
          <StatCard
            v-for="stat in leftStats"
            :key="stat.label"
            :value="stat.value"
            :label="stat.label"
            align="right"
          />
        </div>

        <div class="order-1 flex items-center justify-center py-10 md:order-2 md:py-0">
          <div class="neon-box-glow relative h-64 w-64 rounded-full bg-surface-container-highest p-2 md:h-80 md:w-80">
            <img
              :src="logoSrc"
              :alt="logoAlt"
              class="h-full w-full rounded-full object-cover"
              loading="lazy"
            >
          </div>
        </div>

        <div class="order-3 flex flex-col justify-center space-y-8 md:order-3">
          <StatCard
            v-for="stat in rightStats"
            :key="stat.label"
            :value="stat.value"
            :label="stat.label"
            align="left"
          />
        </div>
      </div>
    </div>
  </section>
</template>
