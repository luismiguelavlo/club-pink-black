<script setup lang="ts">
import type { ClubEvent, EventFilter } from '~/types/site'

const props = withDefaults(
  defineProps<{
    items?: ClubEvent[]
    filter?: EventFilter
    pending?: boolean
  }>(),
  {
    items: () => [],
    filter: 'all',
    pending: false,
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
  <section class="mb-section-gap flex flex-1 flex-col px-gutter-desktop">
    <p
      v-if="pending"
      class="font-body-md flex flex-1 items-center justify-center py-16 text-center text-secondary"
    >
      Cargando calendario…
    </p>

    <template v-else>
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
        class="font-body-md flex flex-1 items-center justify-center py-16 text-center text-secondary"
      >
        No hay rodadas en este filtro. Prueba otra categoría.
      </p>
    </template>
  </section>
</template>
