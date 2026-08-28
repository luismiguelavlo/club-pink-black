<script setup lang="ts">
type MediaKind = 'photo' | 'video'

type MediaItem = {
  id: string
  kind: MediaKind
  title: string
  imageUrl: string | null
  bytes: number | null
  youtubeUrl: string | null
  youtubeId: string | null
  thumbnailUrl: string | null
  previewUrl: string
  createdAt: string
}

type MediaPayload = {
  items: MediaItem[]
  stats: {
    total: number
    photos: number
    videos: number
    bytes: number
  }
  cloudinaryConfigured: boolean
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const filter = ref<'all' | MediaKind>('all')
const search = ref('')
const page = ref(1)
const pageSize = 8

const youtubeOpen = ref(false)
const editOpen = ref(false)
const editingItem = ref<MediaItem | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadProgress = ref<number | null>(null)
const uploadLabel = ref('')
const actionError = ref('')
const isUploading = ref(false)

const { data, refresh, pending, error } = await useFetch<MediaPayload>('/api/admin/media', {
  key: 'admin-media',
  query: computed(() => ({ kind: 'all' })),
})

useSeoMeta({
  title: 'Multimedia | Pink & Black',
})

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  let items = data.value?.items ?? []

  if (filter.value !== 'all') {
    items = items.filter((item) => item.kind === filter.value)
  }

  if (query) {
    items = items.filter((item) => item.title.toLowerCase().includes(query))
  }

  return items
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize)))

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

watch([filter, search], () => {
  page.value = 1
})

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function openFilePicker() {
  if (!data.value?.cloudinaryConfigured) {
    actionError.value =
      'Configura Cloudinary en el .env para subir imágenes (NUXT_CLOUDINARY_*).'
    return
  }
  fileInput.value?.click()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) void uploadFiles(Array.from(files))
}

async function uploadFiles(files: File[]) {
  actionError.value = ''

  if (!data.value?.cloudinaryConfigured) {
    actionError.value =
      'Configura Cloudinary en el .env para subir imágenes (NUXT_CLOUDINARY_*).'
    return
  }

  const images = files.filter((file) =>
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
  )

  if (!images.length) {
    actionError.value = 'Solo se aceptan imágenes JPG, PNG o WEBP. Los videos van por link de YouTube.'
    return
  }

  isUploading.value = true

  try {
    for (const [index, file] of images.entries()) {
      uploadLabel.value = file.name
      uploadProgress.value = Math.round(((index) / images.length) * 100)

      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name.replace(/\.[^.]+$/, ''))

      await $fetch('/api/admin/media/images', {
        method: 'POST',
        body: form,
      })

      uploadProgress.value = Math.round(((index + 1) / images.length) * 100)
    }

    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'Error al subir imagen'
  } finally {
    isUploading.value = false
    window.setTimeout(() => {
      uploadProgress.value = null
      uploadLabel.value = ''
    }, 600)
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (files.length) void uploadFiles(files)
}

function openEdit(item: MediaItem) {
  editingItem.value = item
  editOpen.value = true
}

async function removeItem(item: MediaItem) {
  if (!window.confirm(`¿Eliminar "${item.title}"?`)) return
  actionError.value = ''

  try {
    await $fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    actionError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo eliminar'
  }
}
</script>

<template>
  <div class="relative flex w-full flex-col">
    <div class="relative flex flex-col items-end justify-between gap-8 overflow-hidden px-gutter-mobile py-12 md:flex-row md:px-gutter-desktop">
      <div class="z-10">
        <span class="mb-4 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          Sistema de archivo
        </span>
        <h1 class="max-w-xl font-headline-xl text-3xl text-on-background md:text-headline-xl">
          MULTIMEDIA
          <br>
          <span class="text-primary-container drop-shadow-[0_0_15px_rgba(255,71,156,0.4)]">
            REPOSITORIO
          </span>
        </h1>
      </div>

      <div class="z-10 flex gap-8 md:gap-12">
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Elementos
          </span>
          <span class="font-headline-lg text-2xl text-on-surface md:text-headline-lg">
            {{ (data?.stats.total ?? 0).toString().padStart(2, '0') }}
          </span>
        </div>
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Fotos
          </span>
          <span class="font-headline-lg text-2xl text-on-surface md:text-headline-lg">
            {{ data?.stats.photos ?? 0 }}
          </span>
        </div>
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Sincronización
          </span>
          <span
            class="font-headline-lg text-2xl md:text-headline-lg"
            :class="data?.cloudinaryConfigured ? 'animate-pulse text-primary' : 'text-on-surface-variant'"
          >
            {{ data?.cloudinaryConfigured ? 'ACTIVA' : 'INACTIVA' }}
          </span>
        </div>
      </div>

      <div class="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
    </div>

    <section class="mb-section-gap px-gutter-mobile md:px-gutter-desktop">
      <div
        class="group relative overflow-hidden rounded-xl border-2 border-dashed bg-surface-container-low transition-all duration-500"
        :class="
          isDragging
            ? 'border-primary/70 bg-surface-container-high'
            : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high'
        "
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop="onDrop"
      >
        <div class="relative z-10 flex flex-col items-center justify-center py-16 md:py-20">
          <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest shadow-xl transition-transform duration-500 group-hover:scale-110">
            <MaterialIcon
              name="cloud_upload"
              class="text-4xl text-primary"
            />
          </div>
          <h2 class="mb-2 font-headline-lg text-xl text-on-background md:text-headline-lg">
            Arrastra o sube contenido
          </h2>
          <p class="mb-8 max-w-xl text-center font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            Fotos: JPG / PNG / WEBP vía Cloudinary · Videos: link de YouTube
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              class="rounded-lg bg-primary px-8 py-3 font-label-sm text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.6)]"
              @click="openFilePicker"
            >
              SUBIR FOTOS
            </button>
            <button
              type="button"
              class="rounded-lg border border-outline-variant/40 px-8 py-3 font-label-sm text-on-surface transition-all hover:border-primary hover:text-primary"
              @click="youtubeOpen = true"
            >
              AGREGAR YOUTUBE
            </button>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden"
            @change="onFileChange"
          >
        </div>

        <div
          v-if="uploadProgress !== null"
          class="absolute bottom-0 left-0 w-full border-t border-primary/20 bg-surface-container-highest/95 p-6 backdrop-blur-md md:p-8"
        >
          <div class="mb-4 flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-4">
              <MaterialIcon
                name="sync"
                class="animate-spin text-primary"
              />
              <span class="truncate font-label-sm text-label-sm uppercase text-on-surface">
                Subiendo: {{ uploadLabel }}
              </span>
            </div>
            <span class="font-label-sm text-label-sm text-primary">
              {{ uploadProgress }}%
            </span>
          </div>
          <div class="h-1 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div
              class="h-full bg-primary shadow-[0_0_10px_rgba(255,176,202,1)] transition-all"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
        </div>
      </div>

      <p
        v-if="actionError"
        class="mt-4 font-label-sm text-label-sm text-error"
        role="alert"
      >
        {{ actionError }}
      </p>
    </section>

    <section class="px-gutter-mobile pb-section-gap md:px-gutter-desktop">
      <div class="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div class="flex rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-1">
          <button
            v-for="option in [
              { id: 'all', label: 'Todos' },
              { id: 'photo', label: 'Fotos' },
              { id: 'video', label: 'Videos' },
            ] as const"
            :key="option.id"
            type="button"
            class="rounded-lg px-6 py-2 font-label-sm text-label-sm uppercase transition-all"
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

        <div class="relative w-full md:w-auto">
          <MaterialIcon
            name="search"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant"
          />
          <input
            v-model="search"
            class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high py-2 pl-10 pr-4 font-label-sm text-label-sm text-on-surface transition-colors focus:border-primary/50 focus:outline-none md:w-64"
            placeholder="BUSCAR ARCHIVOS..."
            type="search"
          >
        </div>
      </div>

      <p
        v-if="error"
        class="font-label-sm text-label-sm text-error"
      >
        No se pudo cargar el repositorio.
      </p>
      <p
        v-else-if="pending"
        class="text-on-surface-variant"
      >
        Cargando…
      </p>

      <div
        v-else
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="item in pagedItems"
          :key="item.id"
          class="group relative aspect-square overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container shadow-xl"
        >
          <div
            class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            :style="{ backgroundImage: `url('${item.previewUrl}')` }"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-60" />
          <div
            class="absolute left-3 top-3 rounded px-2 py-1 font-label-sm text-[10px]"
            :class="
              item.kind === 'video'
                ? 'bg-primary/90 text-on-primary'
                : 'bg-surface-container-highest/90 text-on-surface'
            "
          >
            {{ item.kind === 'video' ? 'VIDEO' : 'FOTO' }}
          </div>

          <div class="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div class="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-surface-container-highest/80 p-3 backdrop-blur-md">
              <div class="min-w-0 overflow-hidden">
                <p class="truncate text-xs font-bold">
                  {{ item.title }}
                </p>
                <p class="text-[10px] text-on-surface-variant">
                  <template v-if="item.kind === 'photo'">
                    {{ formatBytes(item.bytes ?? 0) }}
                  </template>
                  <template v-else>
                    YouTube
                  </template>
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-on-primary"
                  aria-label="Editar"
                  @click="openEdit(item)"
                >
                  <MaterialIcon
                    name="edit"
                    class="text-sm"
                  />
                </button>
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-md bg-error-container/10 text-error transition-colors hover:bg-error-container hover:text-on-error-container"
                  aria-label="Eliminar"
                  @click="removeItem(item)"
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

        <button
          type="button"
          class="group flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low transition-all duration-300 hover:border-primary/40"
          @click="youtubeOpen = true"
        >
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-highest transition-colors group-hover:bg-primary/20">
            <MaterialIcon
              name="add"
              class="text-on-surface-variant group-hover:text-primary"
            />
          </div>
          <span class="font-label-sm text-label-sm text-on-surface-variant group-hover:text-on-surface">
            SUBIR MÁS
          </span>
        </button>
      </div>

      <div class="mt-12 flex items-center justify-center gap-4">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary disabled:opacity-20"
          :disabled="page <= 1"
          @click="page -= 1"
        >
          <MaterialIcon name="chevron_left" />
        </button>
        <span class="font-label-sm text-label-sm text-on-surface-variant">
          {{ page }} / {{ totalPages }}
        </span>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary disabled:opacity-20"
          :disabled="page >= totalPages"
          @click="page += 1"
        >
          <MaterialIcon name="chevron_right" />
        </button>
      </div>
    </section>

    <MediaYoutubeModal
      v-model:open="youtubeOpen"
      @created="refresh"
    />
    <MediaEditModal
      v-model:open="editOpen"
      :item="editingItem"
      @saved="refresh"
    />
  </div>
</template>
