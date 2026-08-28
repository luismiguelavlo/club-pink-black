<script setup lang="ts">
import type { ProfileGalleryImage } from '~/types/profile'
import { MAX_GALLERY_PHOTOS } from '~/constants/profile'

const props = defineProps<{
  images: ProfileGalleryImage[]
  isOwnProfile: boolean
  uploading?: boolean
}>()

const emit = defineEmits<{
  upload: [file: File]
  remove: [imageId: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function openPicker() {
  if (!props.isOwnProfile || props.uploading) return
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('upload', file)
  }
  input.value = ''
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="font-headline-lg text-xl text-on-surface">
          Galería del piloto
        </h2>
        <p class="mt-1 text-sm text-on-surface-variant">
          Hasta {{ MAX_GALLERY_PHOTOS }} fotos. Al superar el límite, se eliminan las más recientes.
        </p>
      </div>
      <button
        v-if="isOwnProfile"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 font-label-sm text-[11px] uppercase tracking-wider text-on-primary-container transition-all hover:neon-glow-pink-strong disabled:opacity-50"
        :disabled="uploading"
        @click="openPicker"
      >
        <MaterialIcon name="add_a_photo" />
        {{ uploading ? 'Subiendo…' : 'Agregar foto' }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      >
    </div>

    <div
      v-if="images.length"
      class="grid grid-cols-2 gap-4 md:grid-cols-3"
    >
      <article
        v-for="(image, index) in images"
        :key="image.id"
        class="group relative aspect-square overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high"
      >
        <img
          :src="image.imageUrl"
          :alt="`Foto ${index + 1} del piloto`"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <button
          v-if="isOwnProfile"
          type="button"
          class="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white opacity-0 transition-all hover:bg-error group-hover:opacity-100"
          aria-label="Eliminar foto"
          @click="emit('remove', image.id)"
        >
          <MaterialIcon
            name="delete"
            class="text-sm"
          />
        </button>
      </article>
    </div>

    <div
      v-else
      class="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 p-8 text-center"
    >
      <MaterialIcon
        name="photo_library"
        class="mb-4 text-4xl text-primary/60"
      />
      <p class="font-headline-lg text-lg text-on-surface">
        Sin fotos en la galería
      </p>
      <p class="mt-2 max-w-md text-sm text-on-surface-variant">
        {{
          isOwnProfile
            ? 'Sube hasta 6 imágenes de tus rodadas, tu máquina o momentos del club.'
            : 'Este piloto aún no ha compartido fotos en su galería.'
        }}
      </p>
    </div>
  </section>
</template>
