<script setup lang="ts">
import type { EventFilter } from '~/types/site'
import { eventFilters, eventsHero, footerLinks, getNavLinksForPath } from '~/data/site'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

useSeoMeta({
  title: 'Events | PINK & BLACK ROAD RIDER CLUB',
  description:
    'Calendario de rodadas, meetups y garage nights del Pink & Black Road Rider Club.',
  ogTitle: 'Events | PINK & BLACK ROAD RIDER CLUB',
  ogDescription: eventsHero.description,
})

const activeFilter = ref<EventFilter>('all')

function onRsvp(eventId: string) {
  console.info('RSVP event:', eventId)
  navigateTo('/#contact')
}
</script>

<template>
  <div class="selection:bg-primary selection:text-on-primary">
    <AppNavbar
      :links="links"
      cta-variant="primary-container"
      cta-shape="chamfer"
    />

    <main class="pt-32">
      <ArchiveHero
        :title="eventsHero.title"
        :description="eventsHero.description"
      />
      <ChipFilterBar
        v-model="activeFilter"
        :filters="eventFilters"
      />
      <EventsSchedule
        :filter="activeFilter"
        @rsvp="onRsvp"
      />
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
