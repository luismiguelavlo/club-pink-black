<script setup lang="ts">
import type { ProfileFeedPost } from '~/types/profile'

defineProps<{
  posts: ProfileFeedPost[]
  pending?: boolean
}>()

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
</script>

<template>
  <section class="space-y-6">
    <h2 class="font-headline-lg text-xl text-on-surface">
      Publicaciones
    </h2>

    <p
      v-if="pending"
      class="py-12 text-center text-on-surface-variant"
    >
      Cargando publicaciones…
    </p>

    <div
      v-else-if="posts.length"
      class="space-y-4"
    >
      <article
        v-for="post in posts"
        :key="post.id"
        class="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest/50"
      >
        <div
          v-if="post.images.length === 1"
          class="aspect-video w-full overflow-hidden"
        >
          <img
            :src="post.images[0]!.imageUrl"
            :alt="post.body.slice(0, 80)"
            class="h-full w-full object-cover"
          >
        </div>

        <div
          v-else-if="post.images.length > 1"
          class="grid gap-1 p-2"
          :class="post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
        >
          <div
            v-for="image in post.images"
            :key="image.id"
            class="aspect-square overflow-hidden rounded-lg"
          >
            <img
              :src="image.imageUrl"
              :alt="post.body.slice(0, 40)"
              class="h-full w-full object-cover"
            >
          </div>
        </div>

        <div class="space-y-4 p-6">
          <p class="font-label-sm text-[11px] uppercase tracking-wider text-primary">
            {{ relativeTime(post.createdAt) }}
          </p>
          <p class="whitespace-pre-wrap font-body-md leading-relaxed text-on-surface">
            {{ post.body }}
          </p>
          <div class="flex gap-6 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
            <span>{{ post.ignitesCount }} ignites</span>
            <span>{{ post.commentsCount }} comentarios</span>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/40 p-10 text-center"
    >
      <p class="font-headline-lg text-lg text-on-surface">
        Sin publicaciones aún
      </p>
      <p class="mt-2 text-sm text-on-surface-variant">
        Las historias compartidas en el feed aparecerán aquí.
      </p>
    </div>
  </section>
</template>
