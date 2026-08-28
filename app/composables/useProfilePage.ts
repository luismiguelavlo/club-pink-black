import type { ProfileFeedPost, UserProfile } from '~/types/profile'

export function useProfilePage(userId: Ref<string>) {
  const { user, fetch: refreshSession } = useUserSession()

  const profileKey = computed(() => `profile-${userId.value}`)
  const postsKey = computed(() => `profile-posts-${userId.value}`)

  const {
    data: profileData,
    refresh: refreshProfile,
    pending: profilePending,
    error: profileError,
  } = useFetch<{ profile: UserProfile }>(() => `/api/users/${userId.value}`, {
    key: profileKey,
  })

  const profile = computed(() => profileData.value?.profile)
  const shouldFetchPosts = computed(() => {
    const current = profile.value
    return !!current && !current.isPrivateView
  })

  const {
    data: postsData,
    pending: postsPending,
  } = useFetch<{ posts: ProfileFeedPost[] }>(
    () => (shouldFetchPosts.value ? `/api/users/${userId.value}/posts` : null),
    { key: postsKey },
  )

  const posts = computed(() => postsData.value?.posts ?? [])

  const uploadingAvatar = ref(false)
  const uploadingGallery = ref(false)
  const togglingVisibility = ref(false)
  const actionError = ref('')
  const actionSuccess = ref('')

  async function uploadAvatar(file: File) {
    actionError.value = ''
    actionSuccess.value = ''
    uploadingAvatar.value = true

    try {
      const form = new FormData()
      form.append('file', file)

      await $fetch('/api/me/avatar', {
        method: 'POST',
        body: form,
      })

      await Promise.all([refreshProfile(), refreshSession()])
      actionSuccess.value = 'Foto de perfil actualizada'
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
      actionError.value =
        fetchError.data?.statusMessage
        ?? fetchError.statusMessage
        ?? 'No se pudo subir la foto de perfil'
    }
    finally {
      uploadingAvatar.value = false
    }
  }

  async function uploadGalleryPhoto(file: File) {
    actionError.value = ''
    actionSuccess.value = ''
    uploadingGallery.value = true

    try {
      const form = new FormData()
      form.append('file', file)

      await $fetch('/api/me/gallery', {
        method: 'POST',
        body: form,
      })

      await refreshProfile()
      actionSuccess.value = 'Foto agregada a la galería'
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
      actionError.value =
        fetchError.data?.statusMessage
        ?? fetchError.statusMessage
        ?? 'No se pudo subir la foto'
    }
    finally {
      uploadingGallery.value = false
    }
  }

  async function removeGalleryPhoto(imageId: string) {
    if (!window.confirm('¿Eliminar esta foto de tu galería?')) return

    actionError.value = ''
    actionSuccess.value = ''

    try {
      await $fetch(`/api/me/gallery/${imageId}`, { method: 'DELETE' })
      await refreshProfile()
      actionSuccess.value = 'Foto eliminada'
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
      actionError.value =
        fetchError.data?.statusMessage
        ?? fetchError.statusMessage
        ?? 'No se pudo eliminar la foto'
    }
  }

  async function saveBio(bio: string) {
    if (!user.value) return

    actionError.value = ''
    actionSuccess.value = ''

    try {
      await $fetch('/api/me', {
        method: 'PATCH',
        body: {
          name: user.value.name,
          motorcycle: user.value.motorcycle ?? '',
          bio,
        },
      })
      await refreshProfile()
      actionSuccess.value = 'Bio actualizada'
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
      actionError.value =
        fetchError.data?.statusMessage
        ?? fetchError.statusMessage
        ?? 'No se pudo guardar la bio'
    }
  }

  async function toggleProfileVisibility(isPublic: boolean) {
    if (!user.value || togglingVisibility.value) return

    actionError.value = ''
    actionSuccess.value = ''
    togglingVisibility.value = true

    try {
      await $fetch('/api/me', {
        method: 'PATCH',
        body: {
          name: user.value.name,
          motorcycle: user.value.motorcycle ?? '',
          bio: profile.value?.bio ?? '',
          profilePublic: isPublic,
        },
      })
      await refreshProfile()
      actionSuccess.value = isPublic ? 'Perfil configurado como público' : 'Perfil configurado como privado'
    }
    catch (err: unknown) {
      const fetchError = err as { data?: { statusMessage?: string }; statusMessage?: string }
      actionError.value =
        fetchError.data?.statusMessage
        ?? fetchError.statusMessage
        ?? 'No se pudo actualizar la visibilidad del perfil'
    }
    finally {
      togglingVisibility.value = false
    }
  }

  return {
    user,
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
  }
}
