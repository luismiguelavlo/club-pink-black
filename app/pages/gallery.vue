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
  <AppPageShell
    :links="links"
    :footer-links="footerLinks"
    footer-highlight-brand
    navbar-cta-variant="primary-container"
    navbar-cta-shape="chamfer"
    show-glow
    main-class="pt-32"
  >
    <ArchiveHero />
    <ArchiveFilterBar v-model="activeFilter" />
    <ArchiveMasonryGrid :filter="activeFilter" />
  </AppPageShell>
</template>
