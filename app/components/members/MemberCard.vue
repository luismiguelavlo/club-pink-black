<script setup lang="ts">
import type { ClubMemberPreview } from '~/types/profile'

defineProps<{
  member: ClubMemberPreview
}>()

function roleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Piloto'
}
</script>

<template>
  <NuxtLink
    :to="`/profile/${member.id}`"
    class="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/60 p-5 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_rgba(255,71,156,0.12)]"
  >
    <div class="flex items-start gap-4">
      <UserAvatar
        :name="member.name"
        :avatar-url="member.avatarUrl"
        size="lg"
        ring
      />

      <div class="min-w-0 flex-1">
        <p class="truncate font-headline-lg text-lg text-on-surface group-hover:text-primary">
          {{ member.name }}
        </p>
        <p class="mt-1 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant">
          {{ roleLabel(member.role) }}
        </p>
        <p
          v-if="member.motorcycle"
          class="mt-2 truncate font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant/80"
        >
          {{ member.motorcycle }}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span
        class="inline-flex items-center gap-1 rounded-full px-3 py-1 font-label-sm text-[10px] uppercase tracking-wider"
        :class="
          member.isPublic
            ? 'border border-primary/30 bg-primary/10 text-primary'
            : 'border border-outline-variant/30 bg-surface-container-high text-on-surface-variant'
        "
      >
        <MaterialIcon
          :name="member.isPublic ? 'public' : 'lock'"
          class="text-sm"
        />
        {{ member.isPublic ? 'Público' : 'Privado' }}
      </span>
      <span class="rounded-full border border-outline-variant/30 bg-surface-container-high px-3 py-1 font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
        {{ member.postsCount }} publicaciones
      </span>
    </div>
  </NuxtLink>
</template>
