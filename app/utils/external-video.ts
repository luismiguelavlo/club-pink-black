export type VideoProvider = 'youtube' | 'tiktok'

export function getVideoEmbedUrl(provider: VideoProvider, videoId: string) {
  if (provider === 'tiktok') {
    return `https://www.tiktok.com/embed/v2/${videoId}`
  }
  return `https://www.youtube.com/embed/${videoId}`
}

export function videoProviderLabel(provider: VideoProvider) {
  return provider === 'tiktok' ? 'TikTok' : 'YouTube'
}
