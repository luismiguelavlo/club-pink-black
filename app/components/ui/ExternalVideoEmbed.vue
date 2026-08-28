<script setup lang="ts">
import { getVideoEmbedUrl, type VideoProvider } from '~/utils/external-video'

const props = withDefaults(
  defineProps<{
    provider?: VideoProvider
    videoId: string
    title?: string
  }>(),
  {
    provider: 'youtube',
    title: 'Video',
  },
)

const embedUrl = computed(() => getVideoEmbedUrl(props.provider, props.videoId))
</script>

<template>
  <iframe
    :src="embedUrl"
    :title="title"
    class="h-full w-full"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</template>
