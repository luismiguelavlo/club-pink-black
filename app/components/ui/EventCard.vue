<script setup lang="ts">
import type { ClubEvent, EventStatus } from '~/types/site'

defineProps<{
  event: ClubEvent
}>()

const emit = defineEmits<{
  rsvp: [id: string]
}>()

const statusLabel: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live Now',
  past: 'Completed',
}

const statusClass: Record<EventStatus, string> = {
  upcoming: 'bg-primary text-on-primary',
  live: 'bg-primary-container text-on-primary-container animate-pulse',
  past: 'bg-surface-container-highest text-secondary',
}
</script>

<template>
  <article class="glass-panel group flex flex-col gap-6 rounded-lg p-6 transition-colors duration-300 hover:border-primary/40 md:flex-row md:items-center">
    <div class="flex shrink-0 flex-col items-start md:w-24 md:items-center md:text-center">
      <span class="font-headline-lg text-primary">
        {{ event.dateLabel }}
      </span>
      <span class="font-label-sm mt-1 text-label-sm uppercase tracking-widest text-secondary">
        {{ event.timeLabel }}
      </span>
    </div>

    <div
      class="chamfer-clip hidden h-24 w-36 shrink-0 overflow-hidden bg-surface-container-high md:block"
    >
      <img
        :src="event.imageUrl"
        :alt="event.imageAlt"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      >
    </div>

    <div class="min-w-0 flex-1 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="font-headline-lg-mobile text-on-surface">
          {{ event.title }}
        </h3>
        <span
          class="font-label-sm rounded-full px-3 py-1 text-[10px] uppercase tracking-wider"
          :class="statusClass[event.status]"
        >
          {{ statusLabel[event.status] }}
        </span>
      </div>
      <p class="font-body-md text-secondary">
        {{ event.description }}
      </p>
      <div class="font-label-sm flex flex-wrap items-center gap-4 text-label-sm text-on-secondary-container">
        <span class="inline-flex items-center gap-1">
          <MaterialIcon
            name="location_on"
            class="text-sm text-primary"
          />
          {{ event.location }}
        </span>
        <span
          v-if="event.spotsLeft !== undefined && event.status !== 'past'"
          class="inline-flex items-center gap-1"
        >
          <MaterialIcon
            name="group"
            class="text-sm text-primary"
          />
          {{ event.spotsLeft }} spots
        </span>
      </div>
    </div>

    <div class="shrink-0">
      <AppButton
        v-if="event.status !== 'past'"
        size="sm"
        @click="emit('rsvp', event.id)"
      >
        {{ event.status === 'live' ? 'Join Now' : 'RSVP' }}
      </AppButton>
      <AppButton
        v-else
        variant="ghost"
        size="sm"
        href="/gallery"
      >
        Ver Archivo
      </AppButton>
    </div>
  </article>
</template>
