<script setup lang="ts">
import { getMemberSidebarNav } from '~/data/member-nav'

const { user, clear } = useUserSession()
const route = useRoute()
const router = useRouter()

const navItems = computed(() => getMemberSidebarNav(true))
const isMobileMenuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  },
)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

async function logout() {
  closeMobileMenu()
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
      <MemberSidebarPanel :nav-items="navItems">
        <template #footer="{ onNavigate }">
          <NuxtLink
            to="/settings"
            class="mb-2 flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high p-3 text-left transition-colors hover:border-primary/40"
            @click="onNavigate"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-container-highest font-label-sm text-primary"
            >
              {{ user?.name?.charAt(0)?.toUpperCase() ?? 'A' }}
            </div>
            <div class="min-w-0 flex-1 overflow-hidden">
              <p class="truncate text-sm font-bold text-on-surface">
                {{ user?.name }}
              </p>
              <p class="font-label-sm text-[10px] uppercase text-primary">
                Administrador
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
            @click="onNavigate"
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
        </template>
      </MemberSidebarPanel>
    </aside>

    <MemberMobileDrawer
      :open="isMobileMenuOpen"
      :nav-items="navItems"
      @close="closeMobileMenu"
    >
      <template #footer="{ onNavigate }">
        <NuxtLink
          to="/settings"
          class="mb-2 flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-high p-3 text-left transition-colors hover:border-primary/40"
          @click="onNavigate"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-container-highest font-label-sm text-primary"
          >
            {{ user?.name?.charAt(0)?.toUpperCase() ?? 'A' }}
          </div>
          <div class="min-w-0 flex-1 overflow-hidden">
            <p class="truncate text-sm font-bold text-on-surface">
              {{ user?.name }}
            </p>
            <p class="font-label-sm text-[10px] uppercase text-primary">
              Administrador
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
          @click="onNavigate"
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
      </template>
    </MemberMobileDrawer>

    <div class="lg:pl-72">
      <header
        class="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-background/80 px-gutter-mobile backdrop-blur-xl lg:left-72 lg:h-20 lg:px-gutter-desktop"
      >
        <div class="flex items-center gap-3 lg:gap-4">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-primary transition-colors hover:bg-surface-container-high lg:hidden"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="member-mobile-drawer"
            aria-label="Abrir menú de navegación"
            @click="toggleMobileMenu"
          >
            <MaterialIcon :name="isMobileMenuOpen ? 'close' : 'menu'" />
          </button>
          <NuxtLink
            to="/admin/pilots"
            class="font-headline-lg text-lg text-primary lg:hidden"
          >
            Admin P&amp;B
          </NuxtLink>
          <div class="hidden items-center gap-4 lg:flex">
            <div class="h-2 w-12 rounded-full bg-primary-container" />
            <div class="h-2 w-4 rounded-full bg-secondary-container" />
          </div>
        </div>

        <div class="flex items-center gap-4 lg:gap-6">
          <NotificationsBell />
          <div class="flex items-center gap-2">
            <span class="hidden font-label-sm text-label-sm text-on-surface-variant sm:inline">
              SISTEMA ACTIVO
            </span>
            <div class="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(255,176,202,1)]" />
          </div>
        </div>
      </header>

      <main class="relative min-h-screen bg-background pt-16 lg:pt-20">
        <slot />
      </main>
    </div>
  </div>
</template>
