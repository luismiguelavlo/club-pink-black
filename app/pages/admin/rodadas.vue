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
  createdAt: string
  updatedAt: string
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()

const title = ref('')
const description = ref('')
const startsAt = ref('')
const location = ref('')
const difficulty = ref<EventDifficulty>('pro')
const status = ref<EventStatus>('published')
const formError = ref('')
const isSubmitting = ref(false)
const editingId = ref<string | null>(null)

const { data, refresh, pending } = await useFetch<{
  events: ClubEvent[]
  stats: { total: number; upcoming: number; drafts: number; published: number }
  drafts: ClubEvent[]
  canManage: boolean
}>('/api/rodadas', { key: 'admin-events-creator' })

useSeoMeta({
  title: 'Crear rodada | Pink & Black',
})

const editQueryId = computed(() =>
  typeof route.query.edit === 'string' ? route.query.edit : null,
)

watch(
  editQueryId,
  async (id) => {
    if (!id) return
    try {
      const response = await $fetch<{ event: ClubEvent }>(`/api/rodadas/${id}`)
      loadEvent(response.event)
    } catch {
      formError.value = 'No se pudo cargar la rodada para editar'
    }
  },
  { immediate: true },
)

function toLocalInputValue(iso: string) {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function loadEvent(event: ClubEvent) {
  editingId.value = event.id
  title.value = event.title
  description.value = event.description ?? ''
  startsAt.value = toLocalInputValue(event.startsAt)
  location.value = event.location
  difficulty.value = event.difficulty
  status.value = event.status
  formError.value = ''
}

function resetForm() {
  editingId.value = null
  title.value = ''
  description.value = ''
  startsAt.value = ''
  location.value = ''
  difficulty.value = 'pro'
  status.value = 'published'
  formError.value = ''
  if (route.query.edit) {
    void router.replace({ query: {} })
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeShort(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'ahora'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

function difficultyLabel(value: EventDifficulty) {
  return value === 'beginner' ? 'Principiante' : value === 'pro' ? 'Pro' : 'Extremo'
}

async function onSubmit() {
  formError.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      title: title.value,
      description: description.value,
      startsAt: new Date(startsAt.value).toISOString(),
      location: location.value,
      difficulty: difficulty.value,
      status: status.value,
    }

    if (editingId.value) {
      await $fetch(`/api/rodadas/${editingId.value}`, {
        method: 'PATCH',
        body: payload,
      })
    } else {
      await $fetch('/api/rodadas', {
        method: 'POST',
        body: payload,
      })
    }

    resetForm()
    await refresh()
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      err.data?.statusMessage ?? err.statusMessage ?? 'No se pudo guardar la rodada'
  } finally {
    isSubmitting.value = false
  }
}

async function removeEvent(id: string) {
  if (!window.confirm('¿Eliminar esta rodada?')) return
  await $fetch(`/api/rodadas/${id}`, { method: 'DELETE' })
  if (editingId.value === id) resetForm()
  await refresh()
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">
            Fase de despliegue
          </span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
          COMANDO:
          <span class="text-primary-container">
            {{ editingId ? 'EDITAR RODADA' : 'CREAR RODADA' }}
          </span>
        </h1>
      </div>

      <div class="flex items-center gap-8 rounded-xl border-l-2 border-primary/30 bg-surface-container-low p-4 backdrop-blur-md">
        <div class="flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant">PROTOCOLOS ACTIVOS</span>
          <span class="font-headline-lg text-2xl text-on-surface md:text-headline-lg">
            {{ (data?.stats.published ?? 0).toString().padStart(2, '0') }}
          </span>
        </div>
        <div class="h-10 w-px bg-outline-variant/30" />
        <div class="flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant">PRÓXIMAS RODADAS</span>
          <span class="font-headline-lg text-2xl text-primary md:text-headline-lg">
            {{ (data?.stats.upcoming ?? 0).toString().padStart(2, '0') }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-gutter-desktop">
      <div class="col-span-12 space-y-8 lg:col-span-8">
        <div class="rounded-2xl border-l border-t border-white/5 bg-surface-container-lowest/60 p-6 shadow-2xl backdrop-blur-2xl md:p-8">
          <form
            class="space-y-12"
            @submit.prevent="onSubmit"
          >
            <section class="space-y-6">
              <div class="flex items-center gap-4">
                <span class="rounded bg-primary px-2 py-0.5 font-label-sm text-label-sm text-on-primary">01</span>
                <h2 class="font-headline-lg text-xl text-on-surface md:text-headline-lg">
                  DATOS BASE
                </h2>
              </div>

              <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div class="group space-y-2">
                  <label class="font-label-sm text-label-sm text-on-surface-variant transition-colors group-focus-within:text-primary">
                    NOMBRE DE LA RODADA
                  </label>
                  <input
                    v-model="title"
                    class="w-full border-b border-outline-variant bg-transparent py-3 font-headline-lg text-xl text-on-surface transition-all placeholder:text-surface-variant focus:border-primary focus:outline-none md:text-2xl"
                    placeholder="ej. RODADA FANTASMA"
                    required
                  >
                </div>
                <div class="group space-y-2">
                  <label class="font-label-sm text-label-sm text-on-surface-variant transition-colors group-focus-within:text-primary">
                    FECHA Y HORA
                  </label>
                  <input
                    v-model="startsAt"
                    class="w-full border-b border-outline-variant bg-transparent py-3 font-headline-lg text-xl text-on-surface transition-all focus:border-primary focus:outline-none md:text-2xl [color-scheme:dark]"
                    type="datetime-local"
                    required
                  >
                </div>
              </div>

              <div class="group space-y-2">
                <label class="font-label-sm text-label-sm text-on-surface-variant transition-colors group-focus-within:text-primary">
                  BRIEFING (OPCIONAL)
                </label>
                <textarea
                  v-model="description"
                  rows="3"
                  class="w-full resize-none border-b border-outline-variant bg-transparent py-3 font-body-md text-on-surface placeholder:text-surface-variant focus:border-primary focus:outline-none"
                  placeholder="Detalles de la rodada, punto de encuentro, reglas..."
                />
              </div>
            </section>

            <section class="space-y-6">
              <div class="flex items-center gap-4">
                <span class="rounded bg-primary px-2 py-0.5 font-label-sm text-label-sm text-on-primary">02</span>
                <h2 class="font-headline-lg text-xl text-on-surface md:text-headline-lg">
                  LOGÍSTICA E INTENSIDAD
                </h2>
              </div>

              <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div class="col-span-1 space-y-4">
                  <label class="font-label-sm text-label-sm text-on-surface-variant">
                    NIVEL DE INTENSIDAD
                  </label>
                  <div class="flex flex-col gap-2">
                    <label
                      v-for="option in [
                        { id: 'beginner', label: 'PRINCIPIANTE' },
                        { id: 'pro', label: 'PRO' },
                        { id: 'hardcore', label: 'EXTREMO' },
                      ] as const"
                      :key="option.id"
                      class="flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-surface-container p-4 transition-all hover:bg-surface-container-high has-[:checked]:border-primary/50"
                    >
                      <span class="font-label-sm text-label-sm">{{ option.label }}</span>
                      <input
                        v-model="difficulty"
                        class="h-4 w-4 accent-primary"
                        type="radio"
                        :value="option.id"
                        name="difficulty"
                      >
                    </label>
                  </div>
                </div>

                <div class="space-y-4 md:col-span-2">
                  <label class="font-label-sm text-label-sm text-on-surface-variant">
                    PUNTO DE INICIO Y RUTA
                  </label>
                  <input
                    v-model="location"
                    class="mb-4 w-full border-b border-outline-variant bg-transparent py-3 font-body-md text-on-surface placeholder:text-surface-variant focus:border-primary focus:outline-none"
                    placeholder="Ej. Puente de la 80, Sector Norte"
                    required
                  >
                  <div class="relative h-64 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-high transition-all duration-500 hover:border-primary/40">
                    <div
                      class="h-full w-full bg-cover bg-center opacity-60 mix-blend-luminosity transition-opacity hover:opacity-100"
                      style="background-image: radial-gradient(circle at 30% 40%, rgba(255,71,156,0.35), transparent 45%), linear-gradient(135deg, #1c1b1b, #353535);"
                    />
                    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div class="h-16 w-16 animate-ping rounded-full border-2 border-primary opacity-20" />
                      <div class="absolute h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(255,176,202,1)]" />
                    </div>
                    <div class="absolute bottom-4 left-4 rounded-lg border border-outline-variant/20 bg-surface-dim/80 px-4 py-2 backdrop-blur-md">
                      <p class="font-label-sm text-label-sm text-on-surface">
                        UBICACIÓN: {{ location || 'ESPERANDO COORDENADAS' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-4">
                <span class="rounded bg-primary px-2 py-0.5 font-label-sm text-label-sm text-on-primary">03</span>
                <h2 class="font-headline-lg text-xl text-on-surface">
                  ESTADO DE PUBLICACIÓN
                </h2>
              </div>
              <div class="flex flex-wrap gap-3">
                <label
                  v-for="option in [
                    { id: 'published', label: 'PUBLICADO' },
                    { id: 'draft', label: 'BORRADOR' },
                  ] as const"
                  :key="option.id"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-3 has-[:checked]:border-primary/50"
                >
                  <input
                    v-model="status"
                    type="radio"
                    class="accent-primary"
                    :value="option.id"
                    name="status"
                  >
                  <span class="font-label-sm text-label-sm">{{ option.label }}</span>
                </label>
              </div>
            </section>

            <p
              v-if="formError"
              class="font-label-sm text-label-sm text-error"
              role="alert"
            >
              {{ formError }}
            </p>

            <div class="flex flex-col justify-end gap-4 border-t border-outline-variant/10 pt-8 sm:flex-row sm:items-center">
              <button
                class="px-8 py-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface transition-colors hover:text-primary"
                type="button"
                @click="resetForm"
              >
                Descartar
              </button>
              <button
                class="group relative overflow-hidden bg-primary px-10 py-4 font-headline-lg text-xl text-on-primary transition-all hover:shadow-[0_0_40px_rgba(255,176,202,0.4)] disabled:opacity-60"
                type="submit"
                :disabled="isSubmitting"
              >
                <span class="relative z-10">
                  {{ isSubmitting ? 'GUARDANDO…' : editingId ? 'ACTUALIZAR RODADA' : 'CREAR RODADA' }}
                </span>
                <div class="absolute inset-0 translate-x-[-100%] skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-[100%]" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="col-span-12 space-y-8 lg:col-span-4">
        <div class="rounded-2xl border border-outline-variant/10 bg-surface-container-low/40 p-6">
          <div class="mb-8 flex items-center justify-between">
            <h3 class="font-headline-lg text-xl text-on-surface">
              PROTOCOLOS PENDIENTES
            </h3>
            <span class="font-label-sm text-label-sm text-primary">
              {{ (data?.drafts.length ?? 0).toString().padStart(2, '0') }} BORRADORES
            </span>
          </div>

          <div class="space-y-4">
            <button
              v-for="draft in data?.drafts ?? []"
              :key="draft.id"
              type="button"
              class="group w-full cursor-pointer rounded-xl border-l-2 border-transparent bg-surface-container-high/50 p-5 text-left transition-all hover:border-primary hover:bg-surface-container-highest"
              @click="loadEvent(draft)"
            >
              <div class="mb-2 flex items-start justify-between">
                <span class="font-label-sm text-[10px] uppercase tracking-tighter text-primary">
                  Ruta: {{ draft.location }}
                </span>
                <span class="font-label-sm text-[10px] text-on-surface-variant">
                  {{ relativeShort(draft.updatedAt) }}
                </span>
              </div>
              <h4 class="mb-3 font-headline-lg text-lg text-on-surface">
                {{ draft.title }}
              </h4>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1 text-on-surface-variant">
                  <MaterialIcon
                    name="schedule"
                    class="text-sm"
                  />
                  <span class="font-label-sm text-label-sm">{{ formatTime(draft.startsAt) }}</span>
                </div>
                <div class="flex items-center gap-1 text-on-surface-variant">
                  <MaterialIcon
                    name="speed"
                    class="text-sm"
                  />
                  <span class="font-label-sm text-label-sm">{{ difficultyLabel(draft.difficulty) }}</span>
                </div>
              </div>
            </button>

            <p
              v-if="!pending && !(data?.drafts.length)"
              class="text-sm text-on-surface-variant"
            >
              No hay borradores.
            </p>
          </div>

          <NuxtLink
            to="/rides"
            class="mt-8 block w-full rounded-xl border border-outline-variant/30 py-4 text-center font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant transition-all hover:border-primary hover:text-primary"
          >
            Ver archivo de protocolos
          </NuxtLink>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 p-6">
          <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
          <h4 class="mb-4 font-label-sm text-label-sm text-primary">
            TELEMETRÍA
          </h4>
          <div class="space-y-4">
            <div class="flex items-end justify-between">
              <span class="font-label-sm text-label-sm text-on-surface-variant">PUBLICADOS</span>
              <span class="font-label-sm text-label-sm text-on-surface">{{ data?.stats.published ?? 0 }}</span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                class="h-full bg-primary shadow-[0_0_8px_rgba(255,176,202,1)]"
                :style="{ width: `${Math.min(100, (data?.stats.published ?? 0) * 12)}%` }"
              />
            </div>
            <div class="flex items-end justify-between">
              <span class="font-label-sm text-label-sm text-on-surface-variant">PRÓXIMOS</span>
              <span class="font-label-sm text-label-sm text-on-surface">{{ data?.stats.upcoming ?? 0 }} ACTIVOS</span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                class="h-full bg-primary/60"
                :style="{ width: `${Math.min(100, (data?.stats.upcoming ?? 0) * 15)}%` }"
              />
            </div>
          </div>
        </div>

        <div
          v-if="(data?.events.length ?? 0) > 0"
          class="rounded-2xl border border-outline-variant/10 bg-surface-container-low/40 p-6"
        >
          <h3 class="mb-4 font-headline-lg text-lg text-on-surface">
            TODOS LOS PROTOCOLOS
          </h3>
          <div class="max-h-80 space-y-3 overflow-y-auto">
            <div
              v-for="event in data?.events ?? []"
              :key="event.id"
              class="flex items-start justify-between gap-3 rounded-xl bg-surface-container-high/40 p-3"
            >
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                @click="loadEvent(event)"
              >
                <p class="truncate font-body-md text-on-surface">
                  {{ event.title }}
                </p>
                <p class="font-label-sm text-[10px] uppercase text-on-surface-variant">
                  {{ event.status === 'published' ? 'publicado' : event.status === 'draft' ? 'borrador' : 'cancelado' }} · {{ difficultyLabel(event.difficulty) }}
                </p>
              </button>
              <button
                type="button"
                class="text-on-surface-variant hover:text-error"
                aria-label="Eliminar rodada"
                @click="removeEvent(event.id)"
              >
                <MaterialIcon
                  name="delete"
                  class="text-sm"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
