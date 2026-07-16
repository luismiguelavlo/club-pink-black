<script setup lang="ts">
import type { ClubEvent, EventFilter } from '~/types/site'
import { clubEvents } from '~/data/site'

const props = withDefaults(
  defineProps<{
    items?: ClubEvent[]
    filter?: EventFilter
  }>(),
  {
    items: () => clubEvents,
    filter: 'all',
  },
)

const emit = defineEmits<{
  rsvp: [id: string]
}>()

const featuredEvent = computed(() =>
  props.items.find((event) => event.featured && event.status !== 'past')
  ?? props.items.find((event) => event.status === 'upcoming' || event.status === 'live'),
)

const filteredEvents = computed(() => {
  const withoutFeatured = props.items.filter(
    (event) => event.id !== featuredEvent.value?.id,
  )

  if (props.filter === 'all') {
    return withoutFeatured
  }

  if (props.filter === 'upcoming') {
    return withoutFeatured.filter(
      (event) => event.status === 'upcoming' || event.status === 'live',
    )
  }

  if (props.filter === 'live' || props.filter === 'past') {
    return withoutFeatured.filter((event) => event.status === props.filter)
  }

  return withoutFeatured.filter((event) => event.category === props.filter)
})

const showFeatured = computed(() => {
  if (!featuredEvent.value) {
    return false
  }

  if (props.filter === 'all') {
    return true
  }

  if (props.filter === 'upcoming') {
    return (
      featuredEvent.value.status === 'upcoming'
      || featuredEvent.value.status === 'live'
    )
  }

  if (props.filter === 'live' || props.filter === 'past') {
    return featuredEvent.value.status === props.filter
  }

  return featuredEvent.value.category === props.filter
})
</script>

<template>
  <section class="mb-section-gap px-gutter-desktop">
    <FeaturedEventCard
      v-if="showFeatured && featuredEvent"
      :event="featuredEvent"
      @rsvp="emit('rsvp', $event)"
    />

    <div class="space-y-4">
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        @rsvp="emit('rsvp', $event)"
      />
    </div>

    <p
      v-if="!showFeatured && filteredEvents.length === 0"
      class="font-body-md py-16 text-center text-secondary"
    >
      No hay eventos en este filtro. Prueba otra categoría.
    </p>
  </section>
</template>
