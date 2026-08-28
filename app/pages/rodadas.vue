<script setup lang="ts">
import type { ClubEvent, EventFilter } from '~/types/site'
import { eventFilters, eventsHero, footerLinks, getNavLinksForPath } from '~/data/site'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

useSeoMeta({
  title: 'Rodadas | PINK & BLACK ROAD RIDER CLUB',
  description:
    'Calendario de rodadas, meetups y garage nights del Pink & Black Road Rider Club.',
  ogTitle: 'Rodadas | PINK & BLACK ROAD RIDER CLUB',
  ogDescription: eventsHero.description,
})

const activeFilter = ref<EventFilter>('all')
const rsvpOpen = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventTitle = ref('')

const { data, pending, refresh } = await useAsyncData(
  'public-events',
  () => $fetch<{ events: ClubEvent[] }>('/api/public/rodadas'),
)

const events = computed(() => data.value?.events ?? [])

function onRsvp(eventId: string) {
  const event = events.value.find((item) => item.id === eventId)
  selectedEventId.value = eventId
  selectedEventTitle.value = event?.title ?? ''
  rsvpOpen.value = true
}
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
    <ArchiveHero
      :title="eventsHero.title"
      :description="eventsHero.description"
    />
    <ChipFilterBar
      v-model="activeFilter"
      :filters="eventFilters"
    />
    <EventsSchedule
      :items="events"
      :filter="activeFilter"
      :pending="pending"
      @rsvp="onRsvp"
    />

    <template #after>
      <EventRsvpModal
        v-model:open="rsvpOpen"
        :event-id="selectedEventId"
        :event-title="selectedEventTitle"
        @success="refresh()"
      />
    </template>
  </AppPageShell>
</template>
