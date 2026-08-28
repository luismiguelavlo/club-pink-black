<script setup lang="ts">
import { footerLinks, getNavLinksForPath } from '~/data/site'
import type { ProfileFeedPost, UserProfile } from '~/types/profile'

const route = useRoute()
const links = computed(() => getNavLinksForPath(route.path))

const userId = computed(() => route.params.id as string)

const profileKey = computed(() => `public-profile-${userId.value}`)
const postsKey = computed(() => `public-profile-posts-${userId.value}`)

const {
  data: profileData,
  pending: profilePending,
  error: profileError,
} = await useFetch<{ profile: UserProfile }>(
  () => `/api/public/users/${userId.value}`,
  { key: profileKey },
)

const profile = computed(() => profileData.value?.profile)
const shouldFetchPosts = computed(() => {
  const current = profile.value
  return !!current && !current.isPrivateView
})

const {
  data: postsData,
  pending: postsPending,
} = useFetch<{ posts: ProfileFeedPost[] }>(
  () => (shouldFetchPosts.value ? `/api/public/users/${userId.value}/posts` : null),
  { key: postsKey },
)

const posts = computed(() => postsData.value?.posts ?? [])

useSeoMeta({
  title: () => `${profile.value?.name ?? 'Piloto'} | Pink & Black`,
  description: () => profile.value?.bio ?? 'Perfil de piloto del Pink & Black Road Rider Club',
})
</script>

<template>
  <AppPageShell
    :links="links"
    :footer-links="footerLinks"
  >
    <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="h-[2px] w-12 bg-primary" />
          <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            Piloto del club
          </span>
        </div>
        <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
          PERFIL
        </h1>
      </div>

      <p
        v-if="profilePending"
        class="py-20 text-center text-on-surface-variant"
      >
        Cargando perfil…
      </p>

      <p
        v-else-if="profileError"
        class="py-20 text-center text-error"
      >
        No se pudo cargar este perfil.
      </p>

      <template v-else-if="profile">
        <ProfilePrivateScreen
          v-if="profile.isPrivateView"
          :profile="profile"
          variant="guest"
        />

        <template v-else>
          <ProfileHeader :profile="profile" />

          <ProfileGallery
            :images="profile.gallery"
            :is-own-profile="false"
          />

          <ProfilePosts
            :posts="posts"
            :pending="postsPending"
          />
        </template>
      </template>
    </div>
  </AppPageShell>
</template>
