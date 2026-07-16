<script setup lang="ts">
import type { NavLink } from '~/types/site'
import { brandName } from '~/data/site'

const props = withDefaults(
  defineProps<{
    brand?: string
    links?: NavLink[]
    ctaLabel?: string
    ctaHref?: string
    ctaVariant?: 'primary' | 'primary-container'
    ctaShape?: 'rounded' | 'chamfer'
  }>(),
  {
    brand: brandName,
    links: () => [],
    ctaLabel: 'Join the Family',
    ctaHref: '/#contact',
    ctaVariant: 'primary',
    ctaShape: 'rounded',
  },
)

const isMenuOpen = ref(false)
const route = useRoute()

watch(
  () => props.links,
  () => {
    isMenuOpen.value = false
  },
)

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  },
)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function isExternal(href: string) {
  return href.startsWith('http') || href.startsWith('mailto:')
}
</script>

<template>
  <header
    class="fixed top-0 z-50 w-full border-b border-primary/20 bg-transparent shadow-[0_0_20px_rgba(255,176,202,0.2)] backdrop-blur-xl"
  >
    <div class="flex max-w-full items-center justify-between px-gutter-desktop py-4">
      <NuxtLink
        to="/"
        class="font-headline-xl scale-105 cursor-pointer text-headline-xl font-bold uppercase italic tracking-tighter text-primary transition-transform duration-200"
        @click="closeMenu"
      >
        {{ brand }}
      </NuxtLink>

      <nav class="hidden items-center gap-8 md:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.href + link.label"
          :to="link.href"
          :external="isExternal(link.href)"
          class="font-label-sm text-label-sm transition-colors duration-300"
          :class="
            link.active
              ? 'border-b-2 border-primary pb-1 text-primary'
              : 'text-secondary hover:text-primary'
          "
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <AppButton
        class="hidden md:inline-flex"
        :href="ctaHref"
        :variant="ctaVariant"
        :shape="ctaShape"
        size="sm"
      >
        {{ ctaLabel }}
      </AppButton>

      <button
        type="button"
        class="text-primary md:hidden"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-nav"
        aria-label="Toggle navigation menu"
        @click="toggleMenu"
      >
        <MaterialIcon :name="isMenuOpen ? 'close' : 'menu'" />
      </button>
    </div>

    <div
      v-show="isMenuOpen"
      id="mobile-nav"
      class="border-t border-primary/10 bg-surface-container-lowest/95 px-gutter-desktop py-6 md:hidden"
    >
      <div class="flex flex-col gap-4">
        <NuxtLink
          v-for="link in links"
          :key="`mobile-${link.href}-${link.label}`"
          :to="link.href"
          class="font-label-sm text-label-sm uppercase tracking-wider"
          :class="link.active ? 'text-primary' : 'text-secondary'"
          @click="closeMenu"
        >
          {{ link.label }}
        </NuxtLink>
        <AppButton
          :href="ctaHref"
          :variant="ctaVariant"
          :shape="ctaShape"
          block
          @click="closeMenu"
        >
          {{ ctaLabel }}
        </AppButton>
      </div>
    </div>
  </header>
</template>
