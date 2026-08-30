<script setup lang="ts">
type MarketplaceImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

type MarketplaceListing = {
  id: string
  title: string
  description: string
  priceLabel: string | null
  status: 'active' | 'sold' | 'archived'
  createdAt: string
  seller: {
    id: string
    name: string
    avatarUrl: string | null
    motorcycle: string | null
  }
  images: MarketplaceImage[]
  isMine: boolean
}

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

useSeoMeta({ title: 'Marketplace | Pink & Black' })

const tab = ref<'all' | 'mine'>('all')
const showCreate = ref(false)
const createError = ref('')
const creating = ref(false)

const title = ref('')
const description = ref('')
const priceLabel = ref('')
const imageFiles = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])

const queryKey = computed(() => `marketplace-${tab.value}`)
const { data, pending, refresh, error } = await useFetch<{ listings: MarketplaceListing[] }>(
  () => `/api/marketplace${tab.value === 'mine' ? '?mine=1' : ''}`,
  { key: queryKey, watch: [tab] },
)

const listings = computed(() => data.value?.listings ?? [])

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).slice(0, 3)
  imageFiles.value = files
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
  imagePreviewUrls.value = files.map((f) => URL.createObjectURL(f))
}

function removeImage(index: number) {
  URL.revokeObjectURL(imagePreviewUrls.value[index]!)
  imageFiles.value = imageFiles.value.filter((_, i) => i !== index)
  imagePreviewUrls.value = imagePreviewUrls.value.filter((_, i) => i !== index)
}

async function publishListing() {
  createError.value = ''

  if (!title.value.trim() || title.value.trim().length < 3) {
    createError.value = 'El título debe tener al menos 3 caracteres'
    return
  }
  if (!description.value.trim() || description.value.trim().length < 10) {
    createError.value = 'La descripción debe tener al menos 10 caracteres'
    return
  }
  if (!imageFiles.value.length) {
    createError.value = 'Agrega al menos una foto (máximo 3)'
    return
  }

  creating.value = true
  try {
    const form = new FormData()
    form.append('title', title.value.trim())
    form.append('description', description.value.trim())
    if (priceLabel.value.trim()) form.append('priceLabel', priceLabel.value.trim())
    for (const file of imageFiles.value) {
      form.append('images', file)
    }

    await $fetch('/api/marketplace', { method: 'POST', body: form })
    title.value = ''
    description.value = ''
    priceLabel.value = ''
    imageFiles.value = []
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
    imagePreviewUrls.value = []
    showCreate.value = false
    tab.value = 'mine'
    await refresh()
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    createError.value = e.data?.statusMessage ?? e.statusMessage ?? 'No se pudo publicar'
  }
  finally {
    creating.value = false
  }
}

async function contactSeller(listing: MarketplaceListing) {
  const { conversationId } = await $fetch<{ conversationId: string }>(
    `/api/marketplace/${listing.id}/contact`,
    { method: 'POST' },
  )
  navigateTo(`/messages/${conversationId}`)
}

async function markSold(listing: MarketplaceListing) {
  await $fetch(`/api/marketplace/${listing.id}`, {
    method: 'PATCH',
    body: { status: 'sold' },
  })
  await refresh()
}

async function deleteListing(listing: MarketplaceListing) {
  if (!confirm('¿Eliminar esta publicación?')) return
  await $fetch(`/api/marketplace/${listing.id}`, { method: 'DELETE' })
  await refresh()
}

function statusLabel(status: MarketplaceListing['status']) {
  if (status === 'sold') return 'Vendido'
  if (status === 'archived') return 'Archivado'
  return 'Disponible'
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days < 1) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

onBeforeUnmount(() => {
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
})
</script>

<template>
  <div class="space-y-8 p-gutter-mobile md:p-gutter-desktop">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">Emprende</span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface">
          Marketplace del club
        </h1>
        <p class="max-w-xl text-sm text-on-surface-variant">
          Publica lo que vendes (máx. 3 fotos) y coordina la compra por chat privado. No hay pagos en la app.
        </p>
      </div>
      <AppButton @click="showCreate = true">
        <MaterialIcon name="add" />
        Publicar
      </AppButton>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        class="rounded-xl px-4 py-2 text-sm transition-colors"
        :class="tab === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'"
        @click="tab = 'all'"
      >
        Todos
      </button>
      <button
        type="button"
        class="rounded-xl px-4 py-2 text-sm transition-colors"
        :class="tab === 'mine' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'"
        @click="tab = 'mine'"
      >
        Mis publicaciones
      </button>
      <NuxtLink
        to="/messages"
        class="ml-auto flex items-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
      >
        <MaterialIcon name="chat" class="text-lg" />
        Mensajes
      </NuxtLink>
    </div>

    <div
      v-if="pending"
      class="py-16 text-center text-on-surface-variant"
    >
      Cargando publicaciones...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-error/40 bg-error/10 p-6 text-center text-error"
    >
      No se pudieron cargar las publicaciones.
    </div>

    <div
      v-else-if="listings.length === 0"
      class="rounded-2xl border border-outline-variant/20 bg-surface-container-low/30 p-12 text-center"
    >
      <p class="text-4xl">
        🛒
      </p>
      <p class="mt-3 text-on-surface-variant">
        {{ tab === 'mine' ? 'Aún no tienes publicaciones.' : 'Nadie ha publicado todavía. ¡Sé el primero!' }}
      </p>
    </div>

    <div
      v-else
      class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        v-for="listing in listings"
        :key="listing.id"
        class="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/30"
      >
        <div class="relative aspect-[4/3] bg-surface-container-highest">
          <img
            v-if="listing.images[0]"
            :src="listing.images[0].imageUrl"
            :alt="listing.title"
            class="h-full w-full object-cover"
          >
          <div
            v-else
            class="flex h-full items-center justify-center text-on-surface-variant"
          >
            Sin foto
          </div>
          <span
            v-if="listing.status !== 'active'"
            class="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-on-surface"
          >
            {{ statusLabel(listing.status) }}
          </span>
          <span
            v-if="listing.images.length > 1"
            class="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 text-xs text-on-surface"
          >
            +{{ listing.images.length - 1 }} fotos
          </span>
        </div>

        <div class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-2">
            <h2 class="font-headline-lg text-lg text-on-surface">
              {{ listing.title }}
            </h2>
            <p
              v-if="listing.priceLabel"
              class="shrink-0 font-medium text-primary"
            >
              {{ listing.priceLabel }}
            </p>
          </div>

          <p class="line-clamp-2 text-sm text-on-surface-variant">
            {{ listing.description }}
          </p>

          <div class="flex items-center gap-2 text-xs text-on-surface-variant">
            <img
              v-if="listing.seller.avatarUrl"
              :src="listing.seller.avatarUrl"
              :alt="listing.seller.name"
              class="h-6 w-6 rounded-full object-cover"
            >
            <span
              v-else
              class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary"
            >
              {{ listing.seller.name.charAt(0) }}
            </span>
            <span>{{ listing.seller.name }}</span>
            <span>· {{ relativeTime(listing.createdAt) }}</span>
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <template v-if="listing.isMine">
              <button
                v-if="listing.status === 'active'"
                type="button"
                class="rounded-xl border border-outline-variant/30 px-3 py-2 text-xs uppercase tracking-wide text-on-surface-variant hover:bg-surface-container-high"
                @click="markSold(listing)"
              >
                Marcar vendido
              </button>
              <button
                type="button"
                class="rounded-xl border border-error/40 px-3 py-2 text-xs uppercase tracking-wide text-error hover:bg-error/10"
                @click="deleteListing(listing)"
              >
                Eliminar
              </button>
            </template>
            <button
              v-else-if="listing.status === 'active'"
              type="button"
              class="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary"
              @click="contactSeller(listing)"
            >
              Contactar vendedor
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Create modal -->
    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      @click.self="showCreate = false"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-headline-lg text-xl text-on-surface">
            Nueva publicación
          </h2>
          <button
            type="button"
            class="text-on-surface-variant"
            @click="showCreate = false"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="publishListing"
        >
          <label class="block space-y-1">
            <span class="text-sm text-on-surface-variant">Título</span>
            <input
              v-model="title"
              type="text"
              maxlength="80"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
              placeholder="Ej: Casco AGV talla M"
            >
          </label>

          <label class="block space-y-1">
            <span class="text-sm text-on-surface-variant">Descripción</span>
            <textarea
              v-model="description"
              rows="4"
              maxlength="800"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
              placeholder="Estado, talla, detalles..."
            />
          </label>

          <label class="block space-y-1">
            <span class="text-sm text-on-surface-variant">Precio (opcional, texto libre)</span>
            <input
              v-model="priceLabel"
              type="text"
              maxlength="40"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-on-surface outline-none focus:border-primary"
              placeholder="Ej: $180.000 o A convenir"
            >
          </label>

          <div class="space-y-2">
            <span class="text-sm text-on-surface-variant">Fotos (1 a 3)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              class="block w-full text-sm text-on-surface-variant"
              @change="onFilesSelected"
            >
            <div
              v-if="imagePreviewUrls.length"
              class="flex gap-2"
            >
              <div
                v-for="(url, index) in imagePreviewUrls"
                :key="url"
                class="relative h-20 w-20 overflow-hidden rounded-xl"
              >
                <img
                  :src="url"
                  alt=""
                  class="h-full w-full object-cover"
                >
                <button
                  type="button"
                  class="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-on-surface"
                  @click="removeImage(index)"
                >
                  <MaterialIcon
                    name="close"
                    class="text-sm"
                  />
                </button>
              </div>
            </div>
          </div>

          <p
            v-if="createError"
            class="text-sm text-error"
          >
            {{ createError }}
          </p>

          <AppButton
            type="submit"
            class="w-full"
            :disabled="creating"
          >
            {{ creating ? 'Publicando...' : 'Publicar' }}
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>
