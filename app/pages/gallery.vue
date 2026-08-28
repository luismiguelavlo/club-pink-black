<script setup lang="ts">
import type { GalleryFilter } from '~/types/site'
import { footerLinks, getNavLinksForPath } from '~/data/site'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

useSeoMeta({
  title: 'Galería | PINK & BLACK ROAD RIDER CLUB',
  description:
    'Archivo visual del Pink & Black Road Rider Club: adrenalina, neon y hermandad en la carretera.',
  ogTitle: 'Galería | PINK & BLACK ROAD RIDER CLUB',
  ogDescription:
    'Capturando la adrenalina de la carretera y la hermandad que define al club.',
})

const activeFilter = ref<GalleryFilter>('all')
</script>

<template>
  <div class="selection:bg-primary selection:text-on-primary">
    <AppNavbar
      :links="links"
      cta-variant="primary-container"
      cta-shape="chamfer"
    />

    <main class="pt-32">
      <ArchiveHero />
      <ArchiveFilterBar v-model="activeFilter" />
      <ArchiveMasonryGrid :filter="activeFilter" />
    </main>

    <AppFooter
      :links="footerLinks"
      highlight-brand
    />

    <ClientOnly>
      <GlowFollower />
    </ClientOnly>
  </div>
</template>
