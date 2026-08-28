<script setup lang="ts">
import type { ClubMemberPreview } from '~/types/profile'

definePageMeta({
  layout: 'members',
  middleware: 'auth',
})

const { data, pending, error } = await useFetch<{ members: ClubMemberPreview[] }>('/api/members', {
  key: 'club-members',
})

const members = computed(() => data.value?.members ?? [])
const publicCount = computed(() => members.value.filter((m) => m.isPublic).length)
const membersOnlyCount = computed(() => members.value.filter((m) => !m.isPublic).length)

useSeoMeta({
  title: 'Miembros | Pink & Black',
})
</script>

<template>
  <div class="relative flex w-full flex-col space-y-section-gap p-gutter-mobile md:p-gutter-desktop">
    <div class="space-y-2">
      <div class="flex items-center gap-3">
        <span class="h-[2px] w-12 bg-primary" />
        <span class="font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
          Hermandad
        </span>
      </div>
      <h1 class="font-headline-xl text-3xl text-on-surface md:text-headline-xl">
        MIEMBROS
      </h1>
      <p class="max-w-2xl font-body-md text-on-surface-variant">
        Todos los pilotos registrados. Los perfiles públicos son visibles para cualquiera;
        los de solo miembros requieren iniciar sesión.
      </p>
    </div>

    <div
      v-if="!pending && members.length"
      class="flex flex-wrap gap-3"
    >
      <span class="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-primary">
        {{ members.length }} pilotos
      </span>
      <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface">
        {{ publicCount }} públicos
      </span>
      <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
        {{ membersOnlyCount }} solo miembros
      </span>
    </div>

    <p
      v-if="pending"
      class="py-20 text-center text-on-surface-variant"
    >
      Cargando miembros…
    </p>

    <p
      v-else-if="error"
      class="py-20 text-center text-error"
    >
      No se pudo cargar el directorio de miembros.
    </p>

    <div
      v-else-if="members.length"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <MemberCard
        v-for="member in members"
        :key="member.id"
        :member="member"
      />
    </div>

    <p
      v-else
      class="py-20 text-center text-on-surface-variant"
    >
      Aún no hay miembros registrados.
    </p>
  </div>
</template>
