<script setup lang="ts">
import type { FooterLink } from '~/types/site'
import { brandName, footerTagline } from '~/data/site'

withDefaults(
  defineProps<{
    brand?: string
    links?: FooterLink[]
    tagline?: string
    highlightBrand?: boolean
  }>(),
  {
    brand: brandName,
    links: () => [],
    tagline: footerTagline,
    highlightBrand: false,
  },
)

const year = new Date().getFullYear()
</script>

<template>
  <footer class="w-full border-t border-outline-variant bg-surface-container-lowest py-section-gap">
    <div
      class="flex w-full flex-col items-center justify-between gap-8 px-gutter-desktop md:flex-row"
      :class="highlightBrand ? '' : 'mx-auto max-w-7xl'"
    >
      <div
        class="font-headline-lg text-headline-lg font-bold italic tracking-tighter text-on-surface"
      >
        <template v-if="highlightBrand">
          PINK <span class="text-primary">&</span> BLACK
        </template>
        <template v-else>
          {{ brand }}
        </template>
      </div>

      <div
        class="flex flex-wrap justify-center"
        :class="highlightBrand ? 'gap-8' : 'gap-6'"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.href + link.label"
          :to="link.href"
          class="font-label-sm text-label-sm text-on-secondary-container transition-colors hover:text-primary"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <p
        class="font-label-sm text-label-sm text-primary opacity-80 transition-opacity hover:opacity-100"
        :class="highlightBrand ? '' : 'text-center md:text-right'"
      >
        © {{ year }} {{ tagline }}
      </p>
    </div>
  </footer>
</template>
