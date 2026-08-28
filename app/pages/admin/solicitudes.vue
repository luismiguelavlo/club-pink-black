<script setup lang="ts">
type ContactRequest = {
  id: string
  name: string
  whatsapp: string
  machine: string
  createdAt: string
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const search = ref('')

const { data, pending, error, refresh } = await useFetch<{
  requests: ContactRequest[]
  total: number
}>('/api/admin/contact-requests', {
  key: 'admin-contact-requests',
})

useSeoMeta({
  title: 'Solicitudes de contacto | Pink & Black',
})

const requests = computed(() => data.value?.requests ?? [])

const filteredRequests = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return requests.value

  return requests.value.filter((request) => {
    return (
      request.name.toLowerCase().includes(query)
      || request.machine.toLowerCase().includes(query)
      || request.whatsapp.includes(query.replace(/\D/g, ''))
    )
  })
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return value
}

function whatsappUrl(value: string) {
  return `https://wa.me/${value.replace(/\D/g, '')}`
}
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            Bandeja de entrada
          </span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
          SOLICITUDES
        </h1>
        <p class="max-w-2xl font-body-md text-on-surface-variant">
          Pilotos interesados en unirse al club desde el formulario de la landing.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-primary">
          {{ data?.total ?? 0 }} solicitudes
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          :disabled="pending"
          @click="refresh()"
        >
          <MaterialIcon name="refresh" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="relative">
      <MaterialIcon
        name="search"
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por nombre, máquina o WhatsApp..."
        class="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high/80 py-3 pl-12 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:outline-none"
      >
    </div>

    <p
      v-if="pending"
      class="py-20 text-center text-on-surface-variant"
    >
      Cargando solicitudes…
    </p>

    <p
      v-else-if="error"
      class="py-20 text-center text-error"
    >
      No se pudieron cargar las solicitudes.
    </p>

    <div
      v-else-if="filteredRequests.length"
      class="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/60"
    >
      <div class="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-4 border-b border-outline-variant/20 px-6 py-4 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant md:grid">
        <span>Piloto</span>
        <span>Máquina</span>
        <span>WhatsApp</span>
        <span>Fecha</span>
      </div>

      <div class="divide-y divide-outline-variant/10">
        <article
          v-for="request in filteredRequests"
          :key="request.id"
          class="grid gap-4 px-6 py-5 md:grid-cols-[1.2fr_1fr_1fr_0.8fr] md:items-center"
        >
          <div>
            <p class="font-headline-lg text-lg text-on-surface">
              {{ request.name }}
            </p>
            <p class="mt-1 font-label-sm text-[10px] uppercase tracking-widest text-primary md:hidden">
              {{ formatDate(request.createdAt) }}
            </p>
          </div>

          <p class="font-body-md text-on-surface-variant">
            {{ request.machine }}
          </p>

          <div>
            <a
              :href="whatsappUrl(request.whatsapp)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 font-label-sm text-sm text-primary transition-colors hover:text-primary/80"
            >
              <MaterialIcon name="chat" />
              {{ formatWhatsApp(request.whatsapp) }}
            </a>
          </div>

          <p class="hidden font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant md:block">
            {{ formatDate(request.createdAt) }}
          </p>
        </article>
      </div>
    </div>

    <p
      v-else
      class="py-20 text-center text-on-surface-variant"
    >
      {{ search ? 'No hay solicitudes que coincidan con la búsqueda.' : 'Aún no hay solicitudes de contacto.' }}
    </p>
  </div>
</template>
