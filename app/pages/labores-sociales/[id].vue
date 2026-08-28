<script setup lang="ts">
import { footerLinks, getNavLinksForPath } from '~/data/site'

type SocialWorkImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

type SocialWorkVideo = {
  id: string
  youtubeUrl: string
  youtubeId: string
  thumbnailUrl: string
  title: string | null
  sortOrder: number
}

type SocialWorkPost = {
  id: string
  title: string
  description: string
  status: 'draft' | 'published'
  coverImageUrl: string | null
  images: SocialWorkImage[]
  videos: SocialWorkVideo[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))
const postId = computed(() => route.params.id as string)

const { data, pending, error } = await useFetch<{ post: SocialWorkPost }>(
  () => `/api/public/labores-sociales/${postId.value}`,
  { key: () => `social-work-${postId.value}` },
)

const post = computed(() => data.value?.post)

useSeoMeta({
  title: () => `${post.value?.title ?? 'Labor social'} | Pink & Black`,
  description: () => post.value?.description ?? 'Labor social del Pink & Black Road Rider Club',
})

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const activeImage = ref<string | null>(null)

watch(
  post,
  (value) => {
    activeImage.value = value?.images[0]?.imageUrl ?? null
  },
  { immediate: true },
)
</script>

<template>
  <AppPageShell
    :links="links"
    :footer-links="footerLinks"
    footer-highlight-brand
    navbar-cta-variant="primary-container"
    navbar-cta-shape="chamfer"
    show-glow
    main-class="pt-32"
  >
    <section class="flex flex-1 flex-col px-gutter-mobile pb-section-gap md:px-gutter-desktop">
      <div class="mx-auto w-full max-w-4xl">
        <NuxtLink
          to="/labores-sociales"
          class="mb-8 inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest text-primary transition-colors hover:text-primary-container"
        >
          <MaterialIcon name="arrow_back" />
          Volver al archivo
        </NuxtLink>

        <p
          v-if="pending"
          class="flex min-h-[40vh] items-center justify-center py-16 text-center text-on-surface-variant"
        >
          Cargando…
        </p>

        <p
          v-else-if="error"
          class="flex min-h-[40vh] items-center justify-center py-16 text-center text-error"
        >
          No se encontró esta labor social.
        </p>

        <article
          v-else-if="post"
          class="overflow-hidden"
        >
          <header class="mb-8">
            <p
              v-if="post.publishedAt"
              class="mb-3 font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary"
            >
              {{ formatDate(post.publishedAt) }}
            </p>
            <h1 class="font-headline-xl text-3xl text-on-background md:text-4xl">
              {{ post.title }}
            </h1>
          </header>

          <div
            v-if="post.images.length"
            class="mb-8 overflow-hidden rounded-xl border border-outline-variant/10"
          >
            <div
              class="aspect-[16/9] bg-cover bg-center"
              :style="{ backgroundImage: activeImage ? `url('${activeImage}')` : undefined }"
              role="img"
              :aria-label="post.title"
            />
            <div
              v-if="post.images.length > 1"
              class="flex gap-2 overflow-x-auto border-t border-outline-variant/10 bg-surface-container-low p-3"
            >
              <button
                v-for="image in post.images"
                :key="image.id"
                type="button"
                class="h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors"
                :class="
                  activeImage === image.imageUrl
                    ? 'border-primary'
                    : 'border-transparent opacity-70 hover:opacity-100'
                "
                @click="activeImage = image.imageUrl"
              >
                <div
                  class="h-full w-full bg-cover bg-center"
                  :style="{ backgroundImage: `url('${image.imageUrl}')` }"
                />
              </button>
            </div>
          </div>

          <div
            v-else-if="post.coverImageUrl"
            class="mb-8 aspect-[16/9] overflow-hidden rounded-xl border border-outline-variant/10 bg-cover bg-center"
            :style="{ backgroundImage: `url('${post.coverImageUrl}')` }"
            role="img"
            :aria-label="post.title"
          />

          <div class="prose prose-invert max-w-none">
            <p class="whitespace-pre-wrap font-body-md text-base leading-relaxed text-on-surface-variant">
              {{ post.description }}
            </p>
          </div>

          <div
            v-if="post.videos.length"
            class="mt-12 space-y-8"
          >
            <h2 class="font-headline-lg text-xl text-on-surface">
              Videos
            </h2>
            <div
              v-for="video in post.videos"
              :key="video.id"
              class="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low"
            >
              <div class="aspect-video">
                <iframe
                  :src="`https://www.youtube.com/embed/${video.youtubeId}`"
                  :title="video.title || post.title"
                  class="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              </div>
              <p
                v-if="video.title"
                class="border-t border-outline-variant/10 px-4 py-3 font-label-sm text-sm text-on-surface-variant"
              >
                {{ video.title }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </AppPageShell>
</template>
