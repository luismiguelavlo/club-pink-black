<script setup lang="ts">
type EventDifficulty = 'beginner' | 'pro' | 'hardcore'
type EventStatus = 'draft' | 'published' | 'cancelled'

type ClubEvent = {
  id: string
  title: string
  description: string | null
  startsAt: string
  location: string
  difficulty: EventDifficulty
  status: EventStatus
  isUpcoming: boolean
  rsvpCount: number
  joinedByMe: boolean
}

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const { user } = useUserSession()
const filter = ref<'all' | 'upcoming' | 'past'>('upcoming')

const { data, pending, error, refresh } = await useFetch<{
  events: ClubEvent[]
  stats: { total: number; upcoming: number; drafts: number; published: number }
  canManage: boolean
}>('/api/rodadas', { key: 'members-events' })

useSeoMeta({
  title: 'Rodadas | Pink & Black',
})

const visibleEvents = computed(() => {
  const events = data.value?.events ?? []
  const published = events.filter((event) => event.status === 'published')

  if (filter.value === 'upcoming') {
    return published.filter((event) => event.isUpcoming)
  }
  if (filter.value === 'past') {
    return published.filter((event) => !event.isUpcoming)
  }
  return published
})

function difficultyLabel(value: EventDifficulty) {
  return value === 'beginner' ? 'Principiante' : value === 'pro' ? 'Pro' : 'Extremo'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function removeEvent(id: string) {
  if (!window.confirm('¿Eliminar esta rodada?')) return
  await $fetch(`/api/rodadas/${id}`, { method: 'DELETE' })
  await refresh()
}

const rsvpBusy = ref<Record<string, boolean>>({})
const rsvpError = ref('')

async function toggleRsvp(event: ClubEvent) {
  if (rsvpBusy.value[event.id]) return
  rsvpBusy.value = { ...rsvpBusy.value, [event.id]: true }
  rsvpError.value = ''

  try {
    if (event.joinedByMe) {
      await $fetch(`/api/rodadas/${event.id}/rsvp`, { method: 'DELETE' })
    }
    else {
      await $fetch(`/api/rodadas/${event.id}/rsvp`, { method: 'POST' })
    }
    await refresh()
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
    rsvpError.value =
      fetchError.data?.statusMessage
      ?? fetchError.statusMessage
      ?? 'No se pudo actualizar la inscripción'
  }
  finally {
    rsvpBusy.value = { ...rsvpBusy.value, [event.id]: false }
  }
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="relative flex flex-col justify-between gap-6 overflow-hidden md:flex-row md:items-end">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">
            Calendario de despliegue
          </span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
          CALENDARIO DE
          <span class="text-primary-container">RODADAS</span>
        </h1>
        <p class="max-w-xl text-on-surface-variant">
          Calendario de la hermandad. Todos pueden ver; solo administradores crean protocolos.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-6 rounded-xl border-l-2 border-primary/30 bg-surface-container-low p-4">
          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">PRÓXIMOS</span>
            <span class="font-headline-lg text-2xl text-primary">
              {{ (data?.stats.upcoming ?? 0).toString().padStart(2, '0') }}
            </span>
          </div>
          <div class="h-10 w-px bg-outline-variant/30" />
          <div class="flex flex-col">
            <span class="font-label-sm text-label-sm text-on-surface-variant">PUBLICADOS</span>
            <span class="font-headline-lg text-2xl text-on-surface">
              {{ (data?.stats.published ?? 0).toString().padStart(2, '0') }}
            </span>
          </div>
        </div>

        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/admin/rodadas"
          class="rounded-lg bg-primary px-6 py-3 font-label-sm text-label-sm uppercase tracking-widest text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.5)]"
        >
          Crear rodada
        </NuxtLink>
      </div>
    </div>

    <div class="flex rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-1">
      <button
        v-for="option in [
          { id: 'upcoming', label: 'Próximos' },
          { id: 'past', label: 'Pasados' },
          { id: 'all', label: 'Todos' },
        ] as const"
        :key="option.id"
        type="button"
        class="rounded-lg px-5 py-2 font-label-sm text-label-sm uppercase transition-all"
        :class="
          filter === option.id
            ? 'bg-primary text-on-primary shadow-lg'
            : 'text-on-surface-variant hover:text-on-surface'
        "
        @click="filter = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <p
      v-if="error"
      class="font-label-sm text-label-sm text-error"
    >
      No se pudieron cargar las rodadas.
    </p>
    <p
      v-else-if="rsvpError"
      class="font-label-sm text-label-sm text-error"
    >
      {{ rsvpError }}
    </p>
    <p
      v-else-if="pending"
      class="text-on-surface-variant"
    >
      Cargando protocolos…
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      <article
        v-for="event in visibleEvents"
        :key="event.id"
        class="overflow-hidden rounded-2xl border border-white/5 bg-surface-container-lowest/40 shadow-xl"
      >
        <div class="relative h-40 overflow-hidden bg-surface-container-high">
          <div
            class="h-full w-full bg-cover bg-center opacity-70"
            style="background-image: radial-gradient(circle at 70% 30%, rgba(255,71,156,0.35), transparent 40%), linear-gradient(160deg, #20201f, #0e0e0e);"
          />
          <div class="absolute left-4 top-4 rounded bg-primary/90 px-2 py-1 font-label-sm text-[10px] uppercase text-on-primary">
            {{ difficultyLabel(event.difficulty) }}
          </div>
          <div
            v-if="event.isUpcoming"
            class="absolute right-4 top-4 rounded bg-surface-container-highest/90 px-2 py-1 font-label-sm text-[10px] uppercase text-primary"
          >
            Próximo
          </div>
        </div>

        <div class="space-y-4 p-6">
          <div>
            <h2 class="font-headline-lg text-xl text-on-surface">
              {{ event.title }}
            </h2>
            <p
              v-if="event.description"
              class="mt-2 line-clamp-3 text-sm leading-relaxed text-on-surface-variant"
            >
              {{ event.description }}
            </p>
          </div>

          <div class="flex flex-wrap gap-4 border-t border-outline-variant/10 pt-4">
            <div class="flex items-center gap-2 text-on-surface-variant">
              <MaterialIcon
                name="calendar_month"
                class="text-primary"
              />
              <span class="font-label-sm text-label-sm">{{ formatDate(event.startsAt) }}</span>
            </div>
            <div class="flex items-center gap-2 text-on-surface-variant">
              <MaterialIcon
                name="schedule"
                class="text-primary"
              />
              <span class="font-label-sm text-label-sm">{{ formatTime(event.startsAt) }}</span>
            </div>
            <div class="flex items-center gap-2 text-on-surface-variant">
              <MaterialIcon
                name="location_on"
                class="text-primary"
              />
              <span class="font-label-sm text-label-sm">{{ event.location }}</span>
            </div>
            <div class="flex items-center gap-2 text-on-surface-variant">
              <MaterialIcon
                name="group"
                class="text-primary"
              />
              <span class="font-label-sm text-label-sm">{{ event.rsvpCount }} inscritos</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <AppButton
              v-if="event.isUpcoming"
              size="sm"
              :variant="event.joinedByMe ? 'outline' : 'primary'"
              :disabled="rsvpBusy[event.id]"
              @click="toggleRsvp(event)"
            >
              {{
                rsvpBusy[event.id]
                  ? '…'
                  : event.joinedByMe
                    ? 'Cancelar inscripción'
                    : 'Inscribirme'
              }}
            </AppButton>

            <template v-if="user?.role === 'admin'">
              <NuxtLink
                :to="`/admin/rodadas?edit=${event.id}`"
                class="font-label-sm text-label-sm uppercase tracking-wider text-primary hover:underline"
              >
                Editar
              </NuxtLink>
              <button
                type="button"
                class="font-label-sm text-label-sm uppercase tracking-wider text-error hover:underline"
                @click="removeEvent(event.id)"
              >
                Eliminar
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="!pending && !visibleEvents.length"
      class="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 p-10 text-center"
    >
      <p class="font-headline-lg text-xl text-on-surface">
        No hay rodadas en esta vista
      </p>
      <p class="mt-2 text-on-surface-variant">
        <template v-if="user?.role === 'admin'">
          Crea la primera rodada desde Crear rodada.
        </template>
        <template v-else>
          Cuando un admin publique una rodada, aparecerá aquí.
        </template>
      </p>
    </div>
  </div>
</template>
