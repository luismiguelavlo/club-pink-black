<script setup lang="ts">
import { heroContent } from '~/data/site'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    ctaLabel?: string
    ctaHref?: string
    backgroundImage?: string
    backgroundAlt?: string
  }>(),
  {
    title: heroContent.title,
    subtitle: heroContent.subtitle,
    ctaLabel: heroContent.ctaLabel,
    ctaHref: heroContent.ctaHref,
    backgroundImage: heroContent.backgroundImage,
    backgroundAlt: heroContent.backgroundAlt,
  },
)
</script>

<template>
  <section class="relative flex h-screen w-full items-center justify-center overflow-hidden pt-20">
    <div class="absolute inset-0 z-0">
      <div
        class="h-full w-full bg-cover bg-center opacity-60"
        :style="{ backgroundImage: `url('${backgroundImage}')` }"
        role="img"
        :aria-label="backgroundAlt"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
    </div>

    <div class="relative z-10 px-gutter-mobile text-center md:px-gutter-desktop">
      <h1 class="neon-glow font-headline-xl mb-6 text-[12vw] font-bold uppercase italic tracking-tighter text-primary md:text-headline-xl">
        {{ title }}
      </h1>
      <p class="font-body-md mx-auto mb-10 max-w-2xl text-lg text-secondary">
        {{ subtitle }}
      </p>
      <AppButton
        variant="outline"
        size="lg"
        :href="ctaHref"
      >
        {{ ctaLabel }}
      </AppButton>
    </div>
  </section>
</template>
