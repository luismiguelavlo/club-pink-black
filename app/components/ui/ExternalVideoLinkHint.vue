<script setup lang="ts">
import { EXTERNAL_VIDEO_PLATFORM_HINTS } from '~/utils/external-video'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div
    class="rounded-xl border border-outline-variant/20"
    :class="compact ? 'bg-transparent p-0' : 'bg-surface-container-high/50 p-4'"
  >
    <p
      class="text-on-surface"
      :class="compact ? 'mb-3 text-sm' : 'mb-4 text-sm font-medium'"
    >
      Pega el enlace público del video. Funciona con
      <span class="font-semibold text-[#FF0000]">YouTube</span>
      o
      <span class="font-semibold text-[#25F4EE]">TikTok</span>
      — no subes el archivo.
    </p>

    <div
      class="grid gap-3"
      :class="compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2'"
    >
      <div
        v-for="platform in EXTERNAL_VIDEO_PLATFORM_HINTS"
        :key="platform.provider"
        class="rounded-lg border p-3"
        :class="platform.cardClass"
      >
        <div class="mb-2 flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            :class="platform.badgeClass"
          >
            <MaterialIcon
              :name="platform.icon"
              class="text-sm"
            />
            {{ platform.label }}
          </span>
        </div>
        <ul class="space-y-1 text-[11px] text-on-surface-variant">
          <li
            v-for="example in platform.examples"
            :key="example"
          >
            {{ example }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
