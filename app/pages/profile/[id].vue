<script setup lang="ts">
definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const route = useRoute()
const userId = computed(() => route.params.id as string)

const {
  profile,
  posts,
  profilePending,
  postsPending,
  profileError,
  uploadingAvatar,
  uploadingGallery,
  togglingVisibility,
  actionError,
  actionSuccess,
  uploadAvatar,
  uploadGalleryPhoto,
  removeGalleryPhoto,
  saveBio,
  toggleProfileVisibility,
} = useProfilePage(userId)

useSeoMeta({
  title: () => `${profile.value?.name ?? 'Perfil'} | Pink & Black`,
})
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="h-[2px] w-12 bg-primary" />
        <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          Identidad del piloto
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
      <p
        v-if="actionSuccess"
        class="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-label-sm text-sm text-primary"
      >
        {{ actionSuccess }}
      </p>
      <p
        v-if="actionError"
        class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 font-label-sm text-sm text-error"
      >
        {{ actionError }}
      </p>

      <ProfilePrivateScreen
        v-if="profile.isPrivateView"
        :profile="profile"
      />

      <template v-else>
        <ProfileHeader
          :profile="profile"
          :uploading-avatar="uploadingAvatar"
          :toggling-visibility="togglingVisibility"
          @upload-avatar="uploadAvatar"
          @save-bio="saveBio"
          @toggle-visibility="toggleProfileVisibility"
        />

        <ProfileGallery
          :images="profile.gallery"
          :is-own-profile="profile.isOwnProfile"
          :uploading="uploadingGallery"
          @upload="uploadGalleryPhoto"
          @remove="removeGalleryPhoto"
        />

        <ProfilePosts
          :posts="posts"
          :pending="postsPending"
        />
      </template>
    </template>
  </div>
</template>
