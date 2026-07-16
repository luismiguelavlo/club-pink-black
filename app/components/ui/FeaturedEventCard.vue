<script setup lang="ts">
import type { ClubEvent } from '~/types/site'

defineProps<{
  event: ClubEvent
}>()

const emit = defineEmits<{
  rsvp: [id: string]
}>()
</script>

<template>
  <article class="chamfer-clip relative mb-12 min-h-[420px] overflow-hidden bg-surface-container-high">
    <img
      :src="event.imageUrl"
      :alt="event.imageAlt"
      class="absolute inset-0 h-full w-full object-cover opacity-70"
      loading="eager"
    >
    <div class="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
    <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

    <div class="relative z-10 flex h-full min-h-[420px] flex-col justify-end gap-6 p-8 md:max-w-2xl md:p-12">
      <div class="flex flex-wrap items-center gap-3">
        <span class="font-label-sm bg-primary px-3 py-1 text-[10px] uppercase tracking-widest text-on-primary">
          Next Ride
        </span>
        <span
          v-if="event.spotsLeft !== undefined"
          class="font-label-sm text-label-sm text-secondary"
        >
          {{ event.spotsLeft }} spots left
        </span>
      </div>

      <h2 class="font-headline-xl text-headline-xl uppercase tracking-tight text-white">
        {{ event.title }}
      </h2>

      <p class="font-body-md max-w-xl text-secondary">
        {{ event.description }}
      </p>

      <div class="font-label-sm flex flex-wrap gap-6 text-label-sm uppercase tracking-wider text-on-surface">
        <span class="inline-flex items-center gap-2">
          <MaterialIcon
            name="calendar_month"
            class="text-primary"
          />
          {{ event.dateLabel }} · {{ event.timeLabel }}
        </span>
        <span class="inline-flex items-center gap-2">
          <MaterialIcon
            name="location_on"
            class="text-primary"
          />
          {{ event.location }}
        </span>
      </div>

      <div>
        <AppButton
          variant="primary-container"
          shape="chamfer"
          size="sm"
          @click="emit('rsvp', event.id)"
        >
          Reserve Spot
        </AppButton>
      </div>
    </div>
  </article>
</template>
