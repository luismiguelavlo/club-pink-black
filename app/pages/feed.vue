<script setup lang="ts">
type Author = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
}

type FeedComment = {
  id: string
  body: string
  createdAt: string
  author: Author
  canDelete: boolean
}

type FeedImage = {
  id: string
  imageUrl: string
  sortOrder: number
}

type FeedPost = {
  id: string
  body: string
  createdAt: string
  author: Author
  images: FeedImage[]
  commentsCount: number
  comments: FeedComment[]
  ignitesCount: number
  ignitedByMe: boolean
  canDelete: boolean
}

type TopPilot = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
  postsCount: number
  rank: number
}

type FeedPayload = {
  posts: FeedPost[]
  topPilots: TopPilot[]
}

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const { user } = useUserSession()

const body = ref('')
const isPublishing = ref(false)
const composeError = ref('')
const openComments = ref<Record<string, boolean>>({})
const commentDrafts = ref<Record<string, string>>({})
const commentErrors = ref<Record<string, string>>({})
const submittingComment = ref<Record<string, boolean>>({})
const igniteBusy = ref<Record<string, boolean>>({})

const { data, refresh, pending, error } = await useFetch<FeedPayload>('/api/feed', {
  key: 'social-feed',
})

useSeoMeta({
  title: 'Feed social | Pink & Black',
})

function roleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Piloto'
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

async function publish() {
  composeError.value = ''

  if (!body.value.trim()) {
    composeError.value = 'Escribe una descripción'
    return
  }

  isPublishing.value = true

  try {
    await $fetch('/api/feed/posts', {
      method: 'POST',
      body: { body: body.value.trim() },
    })

    body.value = ''
    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    composeError.value =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo publicar'
  } finally {
    isPublishing.value = false
  }
}

function toggleComments(postId: string) {
  openComments.value[postId] = !openComments.value[postId]
}

async function submitComment(postId: string) {
  const text = (commentDrafts.value[postId] ?? '').trim()
  commentErrors.value[postId] = ''

  if (!text) {
    commentErrors.value[postId] = 'Escribe un comentario'
    return
  }

  submittingComment.value[postId] = true

  try {
    await $fetch(`/api/feed/posts/${postId}/comments`, {
      method: 'POST',
      body: { body: text },
    })
    commentDrafts.value[postId] = ''
    openComments.value[postId] = true
    await refresh()
  } catch (err: unknown) {
    const errorObj = err as { data?: { statusMessage?: string }; statusMessage?: string }
    commentErrors.value[postId] =
      errorObj.data?.statusMessage ?? errorObj.statusMessage ?? 'No se pudo comentar'
  } finally {
    submittingComment.value[postId] = false
  }
}

async function removePost(post: FeedPost) {
  if (!window.confirm('¿Eliminar esta publicación?')) return
  await $fetch(`/api/feed/posts/${post.id}`, { method: 'DELETE' })
  await refresh()
}

async function removeComment(commentId: string) {
  if (!window.confirm('¿Eliminar este comentario?')) return
  await $fetch(`/api/feed/comments/${commentId}`, { method: 'DELETE' })
  await refresh()
}

async function toggleIgnite(post: FeedPost) {
  if (igniteBusy.value[post.id]) return
  igniteBusy.value = { ...igniteBusy.value, [post.id]: true }

  try {
    const result = await $fetch<{ ignited: boolean; ignitesCount: number }>(
      `/api/feed/posts/${post.id}/ignite`,
      { method: 'POST' },
    )

    if (data.value) {
      data.value = {
        ...data.value,
        posts: data.value.posts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                ignitedByMe: result.ignited,
                ignitesCount: result.ignitesCount,
              }
            : item,
        ),
      }
    }
  }
  finally {
    igniteBusy.value = { ...igniteBusy.value, [post.id]: false }
  }
}
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="h-1 w-full overflow-hidden bg-surface-container-highest">
      <div
        class="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(255,176,202,1)] transition-all"
        :class="isPublishing || pending ? 'animate-pulse w-2/3' : ''"
      />
    </div>

    <div class="flex flex-col items-start gap-gutter-desktop p-gutter-mobile md:flex-row md:p-gutter-desktop">
      <div class="min-w-0 flex-1 space-y-gutter-desktop">
        <!-- Composer -->
        <div class="relative rounded-2xl border-l border-t border-white/5 bg-surface-container-lowest/40 p-6 shadow-2xl backdrop-blur-xl">
          <div class="flex gap-4">
            <div class="relative shrink-0">
              <UserAvatar
                :name="user?.name ?? 'Piloto'"
                :avatar-url="user?.avatarUrl"
                size="lg"
                ring
              />
            </div>

            <div class="min-w-0 flex-1">
              <textarea
                v-model="body"
                class="h-20 w-full resize-none border-none bg-transparent font-headline-lg text-lg text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-0 md:text-xl"
                placeholder="Comparte tu rodada, piloto..."
                maxlength="2000"
              />

              <div class="mt-4 flex justify-end border-t border-outline-variant/10 pt-4">
                <button
                  type="button"
                  class="rounded-lg bg-primary px-8 py-2 font-label-sm text-label-sm uppercase tracking-widest text-on-primary transition-all hover:shadow-[0_0_20px_rgba(255,176,202,0.4)] disabled:opacity-50"
                  :disabled="isPublishing"
                  @click="publish"
                >
                  {{ isPublishing ? 'Publicando…' : 'Publicar' }}
                </button>
              </div>

              <p
                v-if="composeError"
                class="mt-3 font-label-sm text-label-sm text-error"
              >
                {{ composeError }}
              </p>
            </div>
          </div>
        </div>

        <p
          v-if="error"
          class="font-label-sm text-label-sm text-error"
        >
          No se pudo cargar el feed.
        </p>
        <p
          v-else-if="pending"
          class="text-on-surface-variant"
        >
          Cargando feed…
        </p>

        <!-- Posts -->
        <article
          v-for="post in data?.posts ?? []"
          :key="post.id"
          class="overflow-hidden rounded-3xl bg-surface-container-lowest/30 shadow-xl"
        >
          <div class="flex items-center justify-between p-6">
            <NuxtLink
              :to="`/profile/${post.author.id}`"
              class="flex items-center gap-4 transition-opacity hover:opacity-90"
            >
              <div class="rounded-full border border-primary/50 p-1">
                <UserAvatar
                  :name="post.author.name"
                  :avatar-url="post.author.avatarUrl"
                />
              </div>
              <div>
                <h3 class="font-headline-lg text-body-md text-on-surface">
                  {{ post.author.name }}
                </h3>
                <p class="font-label-sm text-label-sm uppercase text-primary">
                  {{ roleLabel(post.author.role) }}
                  <span v-if="post.author.motorcycle"> · {{ post.author.motorcycle }}</span>
                  · {{ relativeTime(post.createdAt) }}
                </p>
              </div>
            </NuxtLink>

            <button
              v-if="post.canDelete"
              type="button"
              class="text-on-surface-variant transition-colors hover:text-error"
              aria-label="Eliminar publicación"
              @click="removePost(post)"
            >
              <MaterialIcon name="delete" />
            </button>
          </div>

          <div
            v-if="post.images.length === 1"
            class="relative aspect-video w-full"
          >
            <img
              :src="post.images[0]!.imageUrl"
              :alt="post.body.slice(0, 80)"
              class="h-full w-full object-cover"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent opacity-60" />
          </div>

          <div
            v-else-if="post.images.length > 1"
            class="grid gap-1 px-2"
            :class="post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
          >
            <div
              v-for="image in post.images"
              :key="image.id"
              class="aspect-square overflow-hidden"
            >
              <img
                :src="image.imageUrl"
                :alt="post.body.slice(0, 40)"
                class="h-full w-full object-cover"
              >
            </div>
          </div>

          <div class="p-6">
            <p class="mb-6 whitespace-pre-wrap font-body-md leading-relaxed text-on-surface-variant">
              {{ post.body }}
            </p>

            <div class="flex items-center gap-8 border-t border-outline-variant/10 pt-6">
              <button
                type="button"
                class="group/btn flex items-center gap-2 disabled:opacity-50"
                :disabled="igniteBusy[post.id]"
                @click="toggleIgnite(post)"
              >
                <MaterialIcon
                  name="local_fire_department"
                  :class="
                    post.ignitedByMe
                      ? 'text-primary'
                      : 'text-on-surface-variant transition-colors group-hover/btn:text-primary'
                  "
                />
                <span
                  class="font-label-sm text-label-sm"
                  :class="
                    post.ignitedByMe
                      ? 'text-primary'
                      : 'text-on-surface-variant group-hover/btn:text-on-surface'
                  "
                >
                  {{ post.ignitesCount }} IGNITES
                </span>
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-2"
                @click="toggleComments(post.id)"
              >
                <MaterialIcon
                  name="chat_bubble"
                  class="text-on-surface-variant transition-colors group-hover/btn:text-primary"
                />
                <span class="font-label-sm text-label-sm text-on-surface-variant group-hover/btn:text-on-surface">
                  {{ post.commentsCount }} COMENTARIOS
                </span>
              </button>
            </div>

            <div
              v-if="openComments[post.id]"
              class="mt-6 space-y-4 border-t border-outline-variant/10 pt-6"
            >
              <div
                v-for="comment in post.comments"
                :key="comment.id"
                class="flex gap-3"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs text-primary">
                  {{ comment.author.name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1 rounded-xl bg-surface-container-low/60 px-4 py-3">
                  <div class="mb-1 flex items-start justify-between gap-3">
                    <p class="font-label-sm text-[11px] uppercase tracking-wider text-primary">
                      {{ comment.author.name }} · {{ relativeTime(comment.createdAt) }}
                    </p>
                    <button
                      v-if="comment.canDelete"
                      type="button"
                      class="text-on-surface-variant hover:text-error"
                      aria-label="Eliminar comentario"
                      @click="removeComment(comment.id)"
                    >
                      <MaterialIcon
                        name="close"
                        class="text-sm"
                      />
                    </button>
                  </div>
                  <p class="whitespace-pre-wrap text-sm text-on-surface">
                    {{ comment.body }}
                  </p>
                </div>
              </div>

              <p
                v-if="!post.comments.length"
                class="text-sm text-on-surface-variant"
              >
                Sé el primero en comentar.
              </p>

              <form
                class="flex flex-col gap-3 sm:flex-row"
                @submit.prevent="submitComment(post.id)"
              >
                <input
                  v-model="commentDrafts[post.id]"
                  type="text"
                  maxlength="1000"
                  class="flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:outline-none"
                  placeholder="Escribe un comentario..."
                >
                <button
                  type="submit"
                  class="rounded-xl bg-primary px-5 py-3 font-label-sm text-label-sm uppercase tracking-wider text-on-primary disabled:opacity-50"
                  :disabled="submittingComment[post.id]"
                >
                  {{ submittingComment[post.id] ? '…' : 'Enviar' }}
                </button>
              </form>
              <p
                v-if="commentErrors[post.id]"
                class="font-label-sm text-label-sm text-error"
              >
                {{ commentErrors[post.id] }}
              </p>
            </div>
          </div>
        </article>

        <div
          v-if="!pending && !(data?.posts?.length)"
          class="rounded-3xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 p-10 text-center"
        >
          <p class="font-headline-lg text-xl text-on-surface">
            El feed está en silencio
          </p>
          <p class="mt-2 text-on-surface-variant">
            Sé el primero en publicar una historia de la hermandad.
          </p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="hidden w-80 shrink-0 space-y-gutter-desktop xl:block xl:sticky xl:top-24">
        <div class="rounded-2xl border-t border-white/5 bg-surface-container-low/50 p-6 backdrop-blur-md">
          <h2 class="mb-6 flex items-center gap-3 font-headline-lg text-xl text-on-surface">
            <MaterialIcon
              name="trophy"
              class="text-primary"
            />
            TOP PILOTOS
          </h2>
          <div class="space-y-4">
            <div
              v-for="pilot in data?.topPilots ?? []"
              :key="pilot.id"
              class="flex items-center justify-between rounded-xl bg-surface-container-highest/20 p-3 transition-colors hover:bg-primary/5"
            >
              <NuxtLink
                :to="`/profile/${pilot.id}`"
                class="flex min-w-0 flex-1 items-center gap-3"
              >
                <span
                  class="w-4 font-label-sm text-label-sm"
                  :class="pilot.rank === 1 ? 'text-primary' : 'text-on-surface-variant'"
                >
                  {{ pilot.rank.toString().padStart(2, '0') }}
                </span>
                <UserAvatar
                  :name="pilot.name"
                  :avatar-url="pilot.avatarUrl"
                  size="sm"
                />
                <span class="truncate font-body-md text-on-surface">
                  {{ pilot.name }}
                </span>
              </NuxtLink>
              <span class="font-label-sm text-label-sm text-on-surface-variant">
                {{ pilot.postsCount }} publicaciones
              </span>
            </div>
            <p
              v-if="!(data?.topPilots?.length)"
              class="text-sm text-on-surface-variant"
            >
              Aún no hay actividad.
            </p>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-2xl border-t border-white/5 bg-surface-container-low/50 p-6 backdrop-blur-md">
          <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <h2 class="mb-4 flex items-center gap-3 font-headline-lg text-xl text-on-surface">
            <MaterialIcon
              name="forum"
              class="text-primary"
            />
            COMUNIDAD
          </h2>
          <p class="text-sm leading-relaxed text-on-surface-variant">
            Comparte historias de la hermandad en texto. Todos los miembros pueden comentar.
            Solo el autor o un admin puede eliminar.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>
