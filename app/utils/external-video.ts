export type VideoProvider = 'youtube' | 'tiktok'

export const EXTERNAL_VIDEO_PLATFORM_HINTS = [
  {
    provider: 'youtube' as const,
    label: 'YouTube',
    icon: 'smart_display',
    accentClass: 'text-[#FF0000]',
    badgeClass: 'bg-[#FF0000]/15 text-[#FF0000]',
    cardClass: 'border-[#FF0000]/25 bg-[#FF0000]/5',
    examples: ['youtube.com/watch?v=…', 'youtu.be/…'],
  },
  {
    provider: 'tiktok' as const,
    label: 'TikTok',
    icon: 'music_note',
    accentClass: 'text-[#25F4EE]',
    badgeClass: 'bg-[#25F4EE]/15 text-[#25F4EE]',
    cardClass: 'border-[#25F4EE]/25 bg-[#25F4EE]/5',
    examples: ['tiktok.com/@usuario/video/…', 'vm.tiktok.com/…'],
  },
] as const

export function getVideoEmbedUrl(provider: VideoProvider, videoId: string) {
  if (provider === 'tiktok') {
    return `https://www.tiktok.com/embed/v2/${videoId}`
  }
  return `https://www.youtube.com/embed/${videoId}`
}

export function videoProviderLabel(provider: VideoProvider) {
  return provider === 'tiktok' ? 'TikTok' : 'YouTube'
}
