<script setup lang="ts">
import type { MemberNavItem } from '~/data/member-nav'

const props = defineProps<{
  open: boolean
  navItems: MemberNavItem[]
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()

function close() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => route.fullPath,
  () => close(),
)

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="open"
        type="button"
        class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
        aria-label="Cerrar menú"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="open"
        id="member-mobile-drawer"
        class="fixed left-0 top-0 z-[70] flex h-full w-[min(100vw-3rem,18rem)] flex-col border-r border-outline-variant/20 bg-surface-container-lowest shadow-[10px_0_30px_rgba(255,176,202,0.08)] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div class="flex items-center justify-end p-3">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Cerrar menú"
            @click="close"
          >
            <MaterialIcon
              name="close"
              class="text-2xl"
            />
          </button>
        </div>

        <MemberSidebarPanel
          class="flex-1 overflow-hidden pb-4"
          :nav-items="navItems"
          @navigate="close"
        >
          <template #footer="slotProps">
            <slot
              name="footer"
              v-bind="slotProps"
            />
          </template>
        </MemberSidebarPanel>
      </aside>
    </Transition>
  </Teleport>
</template>
