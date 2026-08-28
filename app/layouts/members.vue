<script setup lang="ts">
import { getMemberSidebarNav } from '~/data/member-nav'

const { user, clear } = useUserSession()
const route = useRoute()
const router = useRouter()

const navItems = computed(() => getMemberSidebarNav(user.value?.role === 'admin'))

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background font-body-md text-body-md text-on-background">
    <aside
      class="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col border-r border-outline-variant/20 bg-surface-container-lowest shadow-[10px_0_30px_rgba(255,176,202,0.03)] lg:flex"
    >
      <div class="flex items-center gap-3 p-gutter-desktop">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container shadow-[0_0_15px_rgba(255,71,156,0.5)]"
        >
          <MaterialIcon name="motorcycle" />
        </div>
        <NuxtLink
          to="/"
          class="font-headline-lg text-xl tracking-tighter text-primary"
        >
          Pink &amp; Black
        </NuxtLink>
      </div>

      <nav class="mt-6 flex-1 space-y-2 px-4">
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
        <NuxtLink
          to="/settings"
          class="mb-2 flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high p-3 text-left transition-colors hover:border-primary/40"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-container-highest font-label-sm text-primary"
          >
            {{ user?.name?.charAt(0)?.toUpperCase() ?? 'P' }}
          </div>
          <div class="min-w-0 flex-1 overflow-hidden">
            <p class="truncate text-sm font-bold text-on-surface">
              {{ user?.name }}
            </p>
            <p class="font-label-sm text-[10px] uppercase text-primary">
              {{ user?.role === 'admin' ? 'Administrador' : 'Piloto' }}
            </p>
          </div>
          <MaterialIcon
            name="tune"
            class="text-on-surface-variant"
          />
        </NuxtLink>
        <NuxtLink
          to="/settings?tab=password"
          class="mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
        >
          <MaterialIcon
            name="lock"
            class="text-sm"
          />
          Cambiar contraseña
        </NuxtLink>
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-on-surface-variant transition-colors hover:text-primary"
          @click="logout"
        >
          <MaterialIcon name="logout" />
          <span class="font-label-sm text-label-sm uppercase tracking-wider">Salir</span>
        </button>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header
        class="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-background/80 px-gutter-mobile backdrop-blur-xl lg:left-72 lg:h-20 lg:px-gutter-desktop"
      >
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/feed"
            class="font-headline-lg text-lg text-primary lg:hidden"
          >
            Feed
          </NuxtLink>
          <div class="hidden items-center gap-4 lg:flex">
            <div class="h-2 w-12 rounded-full bg-primary-container" />
            <div class="h-2 w-4 rounded-full bg-secondary-container" />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <NotificationsBell />
          <NuxtLink
            to="/settings"
            class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary lg:hidden"
          >
            Ajustes
          </NuxtLink>
          <NuxtLink
            v-if="user?.role === 'admin'"
            to="/admin/pilots"
            class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary lg:hidden"
          >
            Admin
          </NuxtLink>
          <div class="flex items-center gap-2">
            <span class="hidden font-label-sm text-label-sm text-on-surface-variant sm:inline">
              SISTEMA ACTIVO
            </span>
            <div class="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(255,176,202,1)]" />
          </div>
          <button
            type="button"
            class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary lg:hidden"
            @click="logout"
          >
            Salir
          </button>
        </div>
      </header>

      <main class="relative min-h-screen bg-background pt-16 lg:pt-20">
        <slot />
      </main>
    </div>
  </div>
</template>
