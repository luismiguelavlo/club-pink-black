<script setup lang="ts">
import { videoProviderLabel } from '~/utils/external-video'

type SocialWorkStatus = 'draft' | 'published'

type SocialWorkImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

type SocialWorkVideo = {
  id: string
  youtubeUrl: string
  youtubeId: string
  videoProvider: 'youtube' | 'tiktok'
  thumbnailUrl: string
  title: string | null
  sortOrder: number
}

type SocialWorkPost = {
  id: string
  title: string
  description: string
  status: SocialWorkStatus
  coverImageUrl: string | null
  images: SocialWorkImage[]
  videos: SocialWorkVideo[]
  publishedAt: string | null
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
const status = ref<SocialWorkStatus>('draft')
const videoUrl = ref('')
const videoTitle = ref('')
const editingId = ref<string | null>(null)
const pendingImages = ref<File[]>([])
const formError = ref('')
const formSuccess = ref('')
const isSubmitting = ref(false)
const isUploadingImages = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)

const { data, refresh, pending } = await useFetch<{
  items: SocialWorkPost[]
  stats: { total: number; published: number; drafts: number }
  cloudinaryConfigured: boolean
}>('/api/admin/labores-sociales', { key: 'admin-social-work' })

useSeoMeta({
  title: 'Labores sociales | Pink & Black',
})

const editQueryId = computed(() =>
  typeof route.query.edit === 'string' ? route.query.edit : null,
)

watch(
  editQueryId,
  async (id) => {
    if (!id) return
    try {
      const response = await $fetch<{ post: SocialWorkPost }>(
        `/api/admin/labores-sociales/${id}`,
      )
      loadPost(response.post)
    }
    catch {
      formError.value = 'No se pudo cargar la publicación para editar'
    }
  },
  { immediate: true },
)

function loadPost(post: SocialWorkPost) {
  editingId.value = post.id
  title.value = post.title
  description.value = post.description
  status.value = post.status
  pendingImages.value = []
  videoUrl.value = ''
  videoTitle.value = ''
  formError.value = ''
  formSuccess.value = ''
}

function resetForm() {
  editingId.value = null
  title.value = ''
  description.value = ''
  status.value = 'draft'
  pendingImages.value = []
  videoUrl.value = ''
  videoTitle.value = ''
  formError.value = ''
  formSuccess.value = ''
  if (route.query.edit) {
    void router.replace({ query: {} })
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  pendingImages.value = [...pendingImages.value, ...files]
}

function removePendingImage(index: number) {
  pendingImages.value = pendingImages.value.filter((_, i) => i !== index)
}

function formatDate(iso: string | null) {
  if (!iso) return 'Borrador'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function uploadPendingImages(postId: string) {
  if (!pendingImages.value.length) return

  const form = new FormData()
  for (const file of pendingImages.value) {
    form.append('images', file)
  }

  isUploadingImages.value = true
  try {
    await $fetch(`/api/admin/labores-sociales/${postId}/images`, {
      method: 'POST',
      body: form,
    })
    pendingImages.value = []
  }
  finally {
    isUploadingImages.value = false
  }
}

async function addExternalVideo(postId: string) {
  const url = videoUrl.value.trim()
  if (!url) return

  await $fetch(`/api/admin/labores-sociales/${postId}/videos`, {
    method: 'POST',
    body: {
      videoUrl: url,
      title: videoTitle.value.trim(),
    },
  })

  videoUrl.value = ''
  videoTitle.value = ''
}

async function submitForm() {
  formError.value = ''
  formSuccess.value = ''
  isSubmitting.value = true

  try {
    let postId = editingId.value

    if (postId) {
      await $fetch(`/api/admin/labores-sociales/${postId}`, {
        method: 'PATCH',
        body: {
          title: title.value,
          description: description.value,
          status: status.value,
        },
      })
    }
    else {
      const response = await $fetch<{ post: SocialWorkPost }>('/api/admin/labores-sociales', {
        method: 'POST',
        body: {
          title: title.value,
          description: description.value,
          status: status.value,
        },
      })
      postId = response.post.id
      editingId.value = postId
    }

    if (postId && pendingImages.value.length) {
      await uploadPendingImages(postId)
    }

    if (postId && videoUrl.value.trim()) {
      await addExternalVideo(postId)
    }

    await refresh()
    formSuccess.value = editingId.value
      ? 'Publicación actualizada correctamente'
      : 'Publicación creada correctamente'

    if (!route.query.edit && postId) {
      await router.replace({ query: { edit: postId } })
    }
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo guardar'
  }
  finally {
    isSubmitting.value = false
  }
}

async function addVideoToExisting() {
  if (!editingId.value || !videoUrl.value.trim()) return
  formError.value = ''
  formSuccess.value = ''

  try {
    await addExternalVideo(editingId.value)
    await refresh()
    formSuccess.value = 'Video agregado'
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo agregar el video'
  }
}

async function uploadMoreImages() {
  if (!editingId.value || !pendingImages.value.length) return
  formError.value = ''
  formSuccess.value = ''

  try {
    await uploadPendingImages(editingId.value)
    await refresh()
    formSuccess.value = 'Imágenes subidas'
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudieron subir las imágenes'
  }
}

async function removeImage(postId: string, imageId: string) {
  if (!window.confirm('¿Eliminar esta imagen?')) return
  formError.value = ''

  try {
    await $fetch(`/api/admin/labores-sociales/${postId}/images/${imageId}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo eliminar la imagen'
  }
}

async function removeVideo(postId: string, videoId: string) {
  if (!window.confirm('¿Eliminar este video?')) return
  formError.value = ''

  try {
    await $fetch(`/api/admin/labores-sociales/${postId}/videos/${videoId}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo eliminar el video'
  }
}

async function removePost(post: SocialWorkPost) {
  if (!window.confirm(`¿Eliminar "${post.title}"?`)) return
  formError.value = ''

  try {
    await $fetch(`/api/admin/labores-sociales/${post.id}`, { method: 'DELETE' })
    if (editingId.value === post.id) resetForm()
    await refresh()
  }
  catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    formError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo eliminar'
  }
}

const editingPost = computed(() =>
  editingId.value ? data.value?.items.find((item) => item.id === editingId.value) : null,
)
</script>

<template>
  <div class="relative flex w-full flex-col">
    <div class="relative flex flex-col items-end justify-between gap-8 overflow-hidden px-gutter-mobile py-12 md:flex-row md:px-gutter-desktop">
      <div class="z-10">
        <span class="mb-4 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          Impacto comunitario
        </span>
        <h1 class="max-w-xl font-headline-xl text-3xl text-on-background md:text-headline-xl">
          LABORES
          <br>
          <span class="text-primary-container drop-shadow-[0_0_15px_rgba(255,71,156,0.4)]">
            SOCIALES
          </span>
        </h1>
      </div>

      <div class="z-10 flex gap-8 md:gap-12">
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Total
          </span>
          <span class="font-headline-lg text-2xl text-on-surface md:text-headline-lg">
            {{ data?.stats.total ?? 0 }}
          </span>
        </div>
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Publicadas
          </span>
          <span class="font-headline-lg text-2xl text-primary md:text-headline-lg">
            {{ data?.stats.published ?? 0 }}
          </span>
        </div>
        <div class="flex flex-col items-end">
          <span class="mb-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
            Borradores
          </span>
          <span class="font-headline-lg text-2xl text-on-surface-variant md:text-headline-lg">
            {{ data?.stats.drafts ?? 0 }}
          </span>
        </div>
      </div>

      <div class="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
    </div>

    <section class="mb-section-gap grid grid-cols-1 gap-8 px-gutter-mobile lg:grid-cols-2 md:px-gutter-desktop">
      <form
        class="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 md:p-8"
        @submit.prevent="submitForm"
      >
        <div class="mb-6 flex items-center justify-between gap-4">
          <h2 class="font-headline-lg text-xl text-on-surface">
            {{ editingId ? 'Editar publicación' : 'Nueva publicación' }}
          </h2>
          <button
            v-if="editingId"
            type="button"
            class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary"
            @click="resetForm"
          >
            Nueva
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <label
              for="sw-title"
              class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Título
            </label>
            <input
              id="sw-title"
              v-model="title"
              type="text"
              required
              maxlength="160"
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none"
              placeholder="Ej. Donación de útiles escolares"
            >
          </div>

          <div>
            <label
              for="sw-description"
              class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Descripción
            </label>
            <textarea
              id="sw-description"
              v-model="description"
              required
              rows="6"
              maxlength="5000"
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none"
              placeholder="Cuenta qué hizo el club, dónde, cuándo y el impacto en la comunidad…"
            />
          </div>

          <div>
            <label
              for="sw-status"
              class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Estado
            </label>
            <select
              id="sw-status"
              v-model="status"
              class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none"
            >
              <option value="draft">
                Borrador
              </option>
              <option value="published">
                Publicada
              </option>
            </select>
          </div>

          <div>
            <label class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Fotos
            </label>
            <button
              type="button"
              class="w-full rounded-lg border border-dashed border-outline-variant/30 px-4 py-6 text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary"
              :disabled="!data?.cloudinaryConfigured"
              @click="fileInput?.click()"
            >
              <MaterialIcon
                name="add_photo_alternate"
                class="mb-2 text-2xl"
              />
              <span class="block font-label-sm text-label-sm uppercase tracking-wider">
                {{ data?.cloudinaryConfigured ? 'Seleccionar fotos' : 'Cloudinary no configurado' }}
              </span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              class="hidden"
              @change="onFileChange"
            >

            <div
              v-if="pendingImages.length"
              class="mt-3 flex flex-wrap gap-2"
            >
              <div
                v-for="(file, index) in pendingImages"
                :key="`${file.name}-${index}`"
                class="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-sm"
              >
                <span class="max-w-[180px] truncate">{{ file.name }}</span>
                <button
                  type="button"
                  class="text-error"
                  @click="removePendingImage(index)"
                >
                  <MaterialIcon
                    name="close"
                    class="text-sm"
                  />
                </button>
              </div>
            </div>

            <button
              v-if="editingId && pendingImages.length"
              type="button"
              class="mt-3 font-label-sm text-label-sm uppercase tracking-wider text-primary hover:underline"
              :disabled="isUploadingImages"
              @click="uploadMoreImages"
            >
              {{ isUploadingImages ? 'Subiendo…' : 'Subir fotos pendientes' }}
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Videos (YouTube o TikTok)
              </h3>
              <p class="text-sm text-on-surface-variant">
                Agrega uno o más videos pegando el enlace público desde cualquiera de las dos plataformas.
              </p>
            </div>

            <ExternalVideoLinkHint compact />

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  for="sw-video-url"
                  class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Enlace del video
                </label>
                <input
                  id="sw-video-url"
                  v-model="videoUrl"
                  type="url"
                  class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none"
                  placeholder="https://youtube.com/... o https://tiktok.com/..."
                >
              </div>
              <div>
                <label
                  for="sw-video-title"
                  class="mb-2 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Título del video (opcional)
                </label>
                <input
                  id="sw-video-title"
                  v-model="videoTitle"
                  type="text"
                  maxlength="160"
                  class="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary/50 focus:outline-none"
                  placeholder="Resumen del video"
                >
              </div>
            </div>
          </div>

          <button
            v-if="editingId && videoUrl.trim()"
            type="button"
            class="font-label-sm text-label-sm uppercase tracking-wider text-primary hover:underline"
            @click="addVideoToExisting"
          >
            Agregar video sin guardar el resto
          </button>
        </div>

        <p
          v-if="formError"
          class="mt-4 font-label-sm text-label-sm text-error"
          role="alert"
        >
          {{ formError }}
        </p>
        <p
          v-if="formSuccess"
          class="mt-4 font-label-sm text-label-sm text-primary"
        >
          {{ formSuccess }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            class="rounded-lg bg-primary px-8 py-3 font-label-sm text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.6)] disabled:opacity-50"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear publicación' }}
          </button>
        </div>

        <div
          v-if="editingPost"
          class="mt-8 space-y-6 border-t border-outline-variant/10 pt-8"
        >
          <div v-if="editingPost.images.length">
            <h3 class="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Fotos actuales
            </h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div
                v-for="image in editingPost.images"
                :key="image.id"
                class="group relative aspect-square overflow-hidden rounded-lg"
              >
                <div
                  class="absolute inset-0 bg-cover bg-center"
                  :style="{ backgroundImage: `url('${image.imageUrl}')` }"
                />
                <button
                  type="button"
                  class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-error/90 text-on-error-container opacity-0 transition-opacity group-hover:opacity-100"
                  @click="removeImage(editingPost.id, image.id)"
                >
                  <MaterialIcon
                    name="delete"
                    class="text-sm"
                  />
                </button>
              </div>
            </div>
          </div>

          <div v-if="editingPost.videos.length">
            <h3 class="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Videos actuales (YouTube o TikTok)
            </h3>
            <div class="space-y-3">
              <div
                v-for="video in editingPost.videos"
                :key="video.id"
                class="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/10 bg-surface-container-high p-3"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="h-12 w-20 shrink-0 rounded bg-cover bg-center"
                    :style="{ backgroundImage: `url('${video.thumbnailUrl}')` }"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-medium text-on-surface">
                        {{ video.title || `Video de ${videoProviderLabel(video.videoProvider)}` }}
                      </p>
                      <span
                        class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                        :class="
                          video.videoProvider === 'tiktok'
                            ? 'bg-[#25F4EE]/15 text-[#25F4EE]'
                            : 'bg-[#FF0000]/15 text-[#FF0000]'
                        "
                      >
                        {{ videoProviderLabel(video.videoProvider) }}
                      </span>
                    </div>
                    <p class="truncate text-xs text-on-surface-variant">
                      {{ video.youtubeUrl }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="text-error"
                  @click="removeVideo(editingPost.id, video.id)"
                >
                  <MaterialIcon name="delete" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div>
        <h2 class="mb-6 font-headline-lg text-xl text-on-surface">
          Publicaciones
        </h2>

        <p
          v-if="pending"
          class="text-on-surface-variant"
        >
          Cargando…
        </p>

        <div
          v-else-if="!data?.items.length"
          class="rounded-xl border border-dashed border-outline-variant/20 p-12 text-center text-on-surface-variant"
        >
          Aún no hay labores sociales publicadas.
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <article
            v-for="post in data.items"
            :key="post.id"
            class="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low transition-colors"
            :class="editingId === post.id ? 'border-primary/40' : ''"
          >
            <div class="flex gap-4 p-4">
              <div
                class="h-20 w-28 shrink-0 rounded-lg bg-cover bg-center bg-surface-container-highest"
                :style="post.coverImageUrl ? { backgroundImage: `url('${post.coverImageUrl}')` } : undefined"
              >
                <div
                  v-if="!post.coverImageUrl"
                  class="flex h-full items-center justify-center"
                >
                  <MaterialIcon
                    name="volunteer_activism"
                    class="text-primary/40"
                  />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded px-2 py-0.5 font-label-sm text-[10px] uppercase"
                    :class="
                      post.status === 'published'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    "
                  >
                    {{ post.status === 'published' ? 'Publicada' : 'Borrador' }}
                  </span>
                  <span class="font-label-sm text-[10px] text-on-surface-variant">
                    {{ formatDate(post.publishedAt) }}
                  </span>
                </div>
                <h3 class="truncate font-headline-lg text-base text-on-surface">
                  {{ post.title }}
                </h3>
                <p class="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                  {{ post.description }}
                </p>
                <div class="mt-2 flex gap-3 text-xs text-on-surface-variant">
                  <span>{{ post.images.length }} fotos</span>
                  <span>{{ post.videos.length }} videos</span>
                </div>
              </div>
            </div>

            <div class="flex border-t border-outline-variant/10">
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 py-3 font-label-sm text-label-sm uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-high"
                @click="loadPost(post); router.replace({ query: { edit: post.id } })"
              >
                <MaterialIcon
                  name="edit"
                  class="text-sm"
                />
                Editar
              </button>
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 border-l border-outline-variant/10 py-3 font-label-sm text-label-sm uppercase tracking-wider text-error transition-colors hover:bg-surface-container-high"
                @click="removePost(post)"
              >
                <MaterialIcon
                  name="delete"
                  class="text-sm"
                />
                Eliminar
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
