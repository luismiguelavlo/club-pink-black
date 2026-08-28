<script setup lang="ts">
import type { ClubMemberPreview } from '~/types/profile'

const { data, pending, error } = await useAsyncData(
  'public-members',
  () => $fetch<{ members: ClubMemberPreview[] }>('/api/public/members'),
)

const members = computed(() => data.value?.members ?? [])
const publicCount = computed(() => members.value.filter((m) => m.isPublic).length)
const membersOnlyCount = computed(() => members.value.filter((m) => !m.isPublic).length)
</script>

<template>
  <section
    id="miembros"
    class="relative bg-background px-gutter-mobile py-section-gap md:px-gutter-desktop"
  >
    <div class="mx-auto max-w-7xl">
      <div class="mb-12 flex flex-col gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span class="mb-2 block font-label-sm text-label-sm uppercase tracking-[0.3em] text-primary">
            La hermandad
          </span>
          <h2 class="font-headline-lg text-on-surface">
            Pilotos del club
          </h2>
          <p class="mt-3 max-w-2xl font-body-md text-on-surface-variant">
            Conoce a los riders de Pink &amp; Black. Los perfiles públicos pueden verse sin cuenta;
            los privados requieren iniciar sesión como piloto registrado.
          </p>
        </div>
        <NuxtLink
          to="/login"
          class="font-label-sm flex shrink-0 items-center gap-2 text-primary transition-all hover:neon-glow"
        >
          Únete al club
          <MaterialIcon name="arrow_forward" />
        </NuxtLink>
      </div>

      <div
        v-if="!pending && members.length"
        class="mb-8 flex flex-wrap gap-3"
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
        class="py-16 text-center text-on-surface-variant"
      >
        Cargando pilotos…
      </p>

      <p
        v-else-if="error"
        class="py-16 text-center text-error"
      >
        No se pudo cargar el directorio de pilotos.
      </p>

      <div
        v-else-if="members.length"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <MemberCard
          v-for="member in members"
          :key="member.id"
          :member="member"
          audience="public"
        />
      </div>

      <p
        v-else
        class="py-16 text-center text-on-surface-variant"
      >
        Aún no hay pilotos registrados.
      </p>
    </div>
  </section>
</template>
