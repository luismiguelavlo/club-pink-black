<script setup lang="ts">
import { footerLinks, getNavLinksForPath } from '~/data/site'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

useSeoMeta({
  title: 'Pink & Black Road Rider Club',
  description:
    'La noche es nuestro territorio. Velocidad, hermandad y el rugir de los motores bajo la luz de neón.',
  ogTitle: 'Pink & Black Road Rider Club',
  ogDescription:
    'La noche es nuestro territorio. Velocidad, hermandad y el rugir de los motores bajo la luz de neón.',
})

function onJoinSubmit(payload: { name: string; machine: string; email: string }) {
  console.info('Join request:', payload)
}
</script>

<template>
  <div>
    <AppNavbar :links="links" />

    <main>
      <HeroSection />
      <StatsSection />
      <GallerySection />
      <ContactSection @submit="onJoinSubmit" />
    </main>

    <AppFooter :links="footerLinks" />
  </div>
</template>
