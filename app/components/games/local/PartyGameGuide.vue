<script setup lang="ts">
import type { GameGuide } from '~/types/games'

defineProps<{
  guide: GameGuide
  emoji?: string
  title?: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-5">
    <div
      v-if="emoji && title"
      class="mb-4 flex items-center gap-3"
    >
      <span class="text-3xl">{{ emoji }}</span>
      <h3 class="font-headline-lg text-lg text-on-surface">
        ¿De qué se trata?
      </h3>
    </div>
    <p class="mb-4 text-on-surface-variant leading-relaxed">
      {{ guide.summary }}
    </p>

    <h4 class="mb-2 font-label-sm text-label-sm uppercase text-primary">
      Cómo se juega
    </h4>
    <ol class="mb-4 space-y-2">
      <li
        v-for="(step, i) in guide.steps"
        :key="i"
        class="flex gap-3 text-sm text-on-surface"
      >
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          {{ i + 1 }}
        </span>
        <span class="pt-0.5">{{ step }}</span>
      </li>
    </ol>

    <template v-if="guide.rules?.length">
      <h4 class="mb-2 font-label-sm text-label-sm uppercase text-primary">
        Reglas
      </h4>
      <ul class="space-y-1.5">
        <li
          v-for="(rule, i) in guide.rules"
          :key="i"
          class="flex gap-2 text-sm text-on-surface-variant"
        >
          <span class="text-primary">•</span>
          <span>{{ rule }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
