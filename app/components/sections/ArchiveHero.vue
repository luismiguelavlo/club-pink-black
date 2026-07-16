<script setup lang="ts">
import { archiveHero } from '~/data/site'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: archiveHero.title,
    description: archiveHero.description,
  },
)
</script>

<template>
  <section class="relative mb-16 px-gutter-desktop">
    <div class="max-w-4xl">
      <h1 class="font-headline-xl mb-4 text-headline-xl uppercase tracking-tight text-white">
        {{ title }}
      </h1>
      <p class="font-body-md max-w-2xl border-l-2 border-primary pl-6 text-body-md text-secondary">
        {{ description }}
      </p>
    </div>
    <div
      class="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
      aria-hidden="true"
    />
  </section>
</template>
