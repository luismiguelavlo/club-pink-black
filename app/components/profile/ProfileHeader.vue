<script setup lang="ts">
import type { UserProfile } from '~/types/profile'

const props = defineProps<{
  profile: UserProfile
  uploadingAvatar?: boolean
  togglingVisibility?: boolean
}>()

const emit = defineEmits<{
  uploadAvatar: [file: File]
  saveBio: [bio: string]
  toggleVisibility: [isPublic: boolean]
}>()

const avatarInput = ref<HTMLInputElement | null>(null)
const bioDraft = ref(props.profile.bio ?? '')
const savingBio = ref(false)

watch(
  () => props.profile.bio,
  (value) => {
    bioDraft.value = value ?? ''
  },
)

function memberSinceLabel(value: string) {
  return new Date(value).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  })
}

function roleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Piloto'
}

function openAvatarPicker() {
  if (!props.profile.isOwnProfile) return
  avatarInput.value?.click()
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('uploadAvatar', file)
  }
  input.value = ''
}

async function saveBio() {
  if (!props.profile.isOwnProfile || savingBio.value) return
  savingBio.value = true
  emit('saveBio', bioDraft.value)
  savingBio.value = false
}
</script>

<template>
  <section class="relative overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/60">
    <div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-[100px]" />
    <div class="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-primary-container/10 blur-[80px]" />

    <div class="relative flex flex-col gap-8 p-6 md:flex-row md:items-end md:p-10">
      <div class="relative shrink-0">
        <button
          type="button"
          class="group relative"
          :class="profile.isOwnProfile ? 'cursor-pointer' : 'cursor-default'"
          :disabled="!profile.isOwnProfile || uploadingAvatar"
          @click="openAvatarPicker"
        >
          <UserAvatar
            :name="profile.name"
            :avatar-url="profile.avatarUrl"
            size="xl"
            ring
          />
          <div
            v-if="profile.isOwnProfile"
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MaterialIcon
              name="photo_camera"
              class="text-2xl text-white"
            />
          </div>
          <div
            v-if="uploadingAvatar"
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/60"
          >
            <span class="font-label-sm text-xs text-white">Subiendo…</span>
          </div>
        </button>
        <input
          ref="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onAvatarChange"
        >
      </div>

      <div class="min-w-0 flex-1 space-y-5">
        <div>
          <p class="mb-2 font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            {{ roleLabel(profile.role) }}
          </p>
          <h1 class="font-headline-xl text-3xl text-on-surface md:text-4xl">
            {{ profile.name }}
          </h1>
          <p
            v-if="profile.motorcycle"
            class="mt-2 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant"
          >
            {{ profile.motorcycle }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface">
            {{ profile.postsCount }} publicaciones
          </span>
          <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface">
            {{ profile.galleryCount }}/6 fotos
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-full px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider"
            :class="
              profile.isPublic
                ? 'border border-primary/30 bg-primary/10 text-primary'
                : 'border border-outline-variant/30 bg-surface-container-high text-on-surface-variant'
            "
          >
            <MaterialIcon
              :name="profile.isPublic ? 'public' : 'lock'"
              class="text-sm"
            />
            {{ profile.isPublic ? 'Perfil público' : 'Solo miembros' }}
          </span>
          <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
            Miembro desde {{ memberSinceLabel(profile.memberSince) }}
          </span>
        </div>

        <div
          v-if="profile.isOwnProfile"
          class="rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-4"
        >
          <p class="mb-3 font-label-sm text-[11px] uppercase tracking-widest text-secondary">
            Visibilidad del perfil
          </p>
          <p class="mb-4 font-body-md text-sm text-on-surface-variant">
            {{
              profile.isPublic
                ? 'Cualquier visitante puede ver tu bio, galería y publicaciones desde la página principal.'
                : 'Solo los pilotos registrados pueden ver tu bio, galería y publicaciones. Los visitantes sin cuenta no tendrán acceso.'
            }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
              :class="
                profile.isPublic
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant/30 bg-surface-container-high text-on-surface-variant hover:border-primary/40'
              "
              :disabled="togglingVisibility || profile.isPublic"
              @click="emit('toggleVisibility', true)"
            >
              <MaterialIcon name="public" />
              Público
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
              :class="
                !profile.isPublic
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant/30 bg-surface-container-high text-on-surface-variant hover:border-primary/40'
              "
              :disabled="togglingVisibility || !profile.isPublic"
              @click="emit('toggleVisibility', false)"
            >
              <MaterialIcon name="lock" />
              Solo miembros
            </button>
          </div>
        </div>

        <div v-if="profile.isOwnProfile">
          <label class="mb-2 block font-label-sm text-[11px] uppercase tracking-widest text-secondary">
            Bio del piloto
          </label>
          <textarea
            v-model="bioDraft"
            rows="3"
            maxlength="280"
            class="w-full resize-none rounded-xl border border-outline-variant/20 bg-surface-container-high/80 px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/50 focus:outline-none"
            placeholder="Cuéntanos sobre tu estilo de rodada, tu máquina o la hermandad..."
          />
          <div class="mt-2 flex items-center justify-between">
            <span class="font-label-sm text-[10px] text-on-surface-variant">
              {{ bioDraft.length }}/280
            </span>
            <button
              type="button"
              class="rounded-lg bg-primary px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-primary disabled:opacity-50"
              :disabled="savingBio"
              @click="saveBio"
            >
              Guardar bio
            </button>
          </div>
        </div>

        <p
          v-else-if="profile.bio"
          class="max-w-2xl whitespace-pre-wrap font-body-md leading-relaxed text-on-surface-variant"
        >
          {{ profile.bio }}
        </p>
      </div>
    </div>
  </section>
</template>
