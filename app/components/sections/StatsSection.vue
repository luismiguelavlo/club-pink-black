<script setup lang="ts">
import type { PhilosophyContent, StatItem } from '~/types/site'
import { clubLogo, clubStats, philosophyContent } from '~/data/site'

const props = withDefaults(
  defineProps<{
    stats?: StatItem[]
    logoSrc?: string
    logoAlt?: string
    philosophy?: PhilosophyContent
  }>(),
  {
    stats: () => clubStats,
    logoSrc: clubLogo.src,
    logoAlt: clubLogo.alt,
    philosophy: () => philosophyContent,
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

      <div class="mt-16 border-t border-outline-variant/30 pt-16 md:mt-20 md:pt-20">
        <div class="mx-auto max-w-3xl text-center">
          <span class="mb-3 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            Filosofía
          </span>
          <h2 class="font-headline-lg text-balance text-on-surface">
            {{ philosophy.title }}
          </h2>
          <p class="mt-4 font-body-md text-on-surface-variant">
            {{ philosophy.intro }}
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-2">
          <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 md:p-8">
            <h3 class="font-headline-lg mb-5 text-lg text-on-surface">
              {{ philosophy.rulesTitle }}
            </h3>
            <ul class="space-y-4">
              <li
                v-for="(rule, index) in philosophy.rules"
                :key="index"
                class="flex gap-3 font-body-md text-on-surface-variant"
              >
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{{ rule }}</span>
              </li>
            </ul>
          </div>

          <div class="space-y-6">
            <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-6 md:p-8">
              <h3 class="font-headline-lg mb-3 text-lg text-on-surface">
                {{ philosophy.newMemberTitle }}
              </h3>
              <p class="mb-4 font-body-md text-on-surface-variant">
                {{ philosophy.newMemberIntro }}
              </p>
              <ul class="space-y-2">
                <li
                  v-for="(item, index) in philosophy.newMemberChecklist"
                  :key="index"
                  class="font-body-md text-on-surface-variant"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h3 class="font-headline-lg mb-3 text-lg text-on-surface">
                {{ philosophy.essenceTitle }}
              </h3>
              <p class="font-body-md text-on-surface-variant">
                {{ philosophy.essence }}
              </p>
              <p class="mt-4 font-label-sm text-label-sm uppercase tracking-wider text-primary">
                {{ philosophy.closing }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
