<script setup lang="ts">
import type { MemberNavItem } from '~/data/member-nav'

defineProps<{
  navItems: MemberNavItem[]
}>()

const emit = defineEmits<{
  navigate: []
}>()

const route = useRoute()

function onNavigate() {
  emit('navigate')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-3 p-gutter-desktop">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container shadow-[0_0_15px_rgba(255,71,156,0.5)]"
      >
        <MaterialIcon name="motorcycle" />
      </div>
      <NuxtLink
        to="/"
        class="font-headline-lg text-xl tracking-tighter text-primary"
        @click="onNavigate"
      >
        Pink &amp; Black
      </NuxtLink>
    </div>

    <nav class="mt-6 flex-1 space-y-2 overflow-y-auto px-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.href"
        :to="item.href"
        class="group flex items-center rounded-xl px-4 py-3 transition-all duration-300"
        :class="
          item.match(route.path)
            ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(255,176,202,0.4)]'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        "
        @click="onNavigate"
      >
        <MaterialIcon
          :name="item.icon"
          class="mr-3 transition-transform group-hover:scale-110"
          :class="item.match(route.path) ? 'text-on-primary' : 'text-primary'"
        />
        <span class="font-label-sm text-label-sm uppercase tracking-widest">
          {{ item.label }}
        </span>
      </NuxtLink>
    </nav>

    <div class="border-t border-outline-variant/10 p-6">
      <slot name="footer" :on-navigate="onNavigate" />
    </div>
  </div>
</template>
