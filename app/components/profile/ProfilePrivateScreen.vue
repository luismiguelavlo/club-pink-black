<script setup lang="ts">
import type { UserProfile } from '~/types/profile'

const props = withDefaults(
  defineProps<{
    profile: UserProfile
    variant?: 'guest' | 'members'
  }>(),
  {
    variant: 'members',
  },
)

const loginRedirect = computed(() => `/login?redirect=${encodeURIComponent(`/profile/${props.profile.id}`)}`)
</script>

<template>
  <section class="relative overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest/60">
    <div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-[100px]" />
    <div class="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-primary-container/10 blur-[80px]" />

    <div class="relative flex flex-col items-center gap-8 px-6 py-20 text-center md:px-10">
      <UserAvatar
        :name="profile.name"
        :avatar-url="profile.avatarUrl"
        size="xl"
        ring
      />

      <div class="space-y-3">
        <h2 class="font-headline-xl text-2xl text-on-surface md:text-3xl">
          {{ profile.name }}
        </h2>
        <p class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          {{ variant === 'guest' ? 'Solo para miembros' : 'Perfil privado' }}
        </p>
      </div>

      <div class="flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high">
        <MaterialIcon
          name="lock"
          class="text-4xl text-on-surface-variant"
        />
      </div>

      <div class="max-w-md space-y-2">
        <p class="font-body-md text-on-surface">
          {{
            variant === 'guest'
              ? 'Este piloto ha configurado su perfil como privado.'
              : 'Este perfil no está disponible en esta vista.'
          }}
        </p>
        <p class="font-body-md text-sm text-on-surface-variant">
          {{
            variant === 'guest'
              ? 'Inicia sesión como piloto registrado para ver su bio, galería y publicaciones.'
              : 'Vuelve al directorio de miembros para explorar otros perfiles.'
          }}
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <NuxtLink
          v-if="variant === 'guest'"
          :to="loginRedirect"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-label-sm text-sm uppercase tracking-wider text-on-primary transition-colors hover:bg-primary/90"
        >
          <MaterialIcon name="login" />
          Iniciar sesión
        </NuxtLink>

        <NuxtLink
          :to="variant === 'guest' ? '/#miembros' : '/members'"
          class="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 font-label-sm text-sm uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
        >
          <MaterialIcon name="groups" />
          {{ variant === 'guest' ? 'Ver pilotos' : 'Volver a miembros' }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
