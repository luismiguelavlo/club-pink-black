<script setup lang="ts">
import type { FooterLink, NavLink } from '~/types/site'

withDefaults(
  defineProps<{
    links?: NavLink[]
    footerLinks?: FooterLink[]
    footerHighlightBrand?: boolean
    navbarCtaVariant?: 'primary' | 'primary-container'
    navbarCtaShape?: 'rounded' | 'chamfer'
    showGlow?: boolean
    mainClass?: string
  }>(),
  {
    links: () => [],
    footerLinks: () => [],
    footerHighlightBrand: false,
    navbarCtaVariant: 'primary',
    navbarCtaShape: 'rounded',
    showGlow: false,
    mainClass: '',
  },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-on-background selection:bg-primary selection:text-on-primary">
    <slot name="navbar">
      <AppNavbar
        :links="links"
        :cta-variant="navbarCtaVariant"
        :cta-shape="navbarCtaShape"
      />
    </slot>

    <main
      class="flex flex-1 flex-col"
      :class="mainClass"
    >
      <slot />
    </main>

    <slot name="footer">
      <AppFooter
        v-if="footerLinks.length"
        :links="footerLinks"
        :highlight-brand="footerHighlightBrand"
      />
    </slot>

    <slot name="after" />

    <ClientOnly>
      <GlowFollower v-if="showGlow" />
    </ClientOnly>
  </div>
</template>
