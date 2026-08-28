export type VideoProvider = 'youtube' | 'tiktok'

export type ParsedExternalVideo = {
  provider: VideoProvider
  videoUrl: string
  videoId: string
  thumbnailUrl: string
  embedUrl: string
}

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

const TIKTOK_REGEX = /tiktok\.com\/@[^/]+\/video\/(\d+)/

export function extractYoutubeId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_REGEX)
  return match?.[1] ?? null
}

export function extractTikTokVideoId(url: string): string | null {
  const trimmed = url.trim()
  const directMatch = trimmed.match(TIKTOK_REGEX)
  if (directMatch?.[1]) return directMatch[1]

  const embedMatch = trimmed.match(/tiktok\.com\/embed\/v2\/(\d+)/)
  if (embedMatch?.[1]) return embedMatch[1]

  const queryMatch = trimmed.match(/[?&]video_id=(\d+)/)
  if (queryMatch?.[1]) return queryMatch[1]

  return null
}

export function youtubeThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

export function getVideoEmbedUrl(provider: VideoProvider, videoId: string) {
  if (provider === 'tiktok') {
    return `https://www.tiktok.com/embed/v2/${videoId}`
  }
  return `https://www.youtube.com/embed/${videoId}`
}

export function isLikelyExternalVideoUrl(url: string) {
  const trimmed = url.trim().toLowerCase()
  return (
    trimmed.includes('youtube.com')
    || trimmed.includes('youtu.be')
    || trimmed.includes('tiktok.com')
    || trimmed.includes('vm.tiktok.com')
  )
}

type TikTokOembedResponse = {
  thumbnail_url?: string
  embed_link?: string
}

async function resolveTikTokVideo(url: string): Promise<{ videoId: string; thumbnailUrl: string } | null> {
  const directId = extractTikTokVideoId(url)

  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url.trim())}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PinkBlackBot/1.0)',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (directId) {
        return {
          videoId: directId,
          thumbnailUrl: '',
        }
      }
      return null
    }

    const data = (await response.json()) as TikTokOembedResponse
    const idFromEmbed = data.embed_link?.match(/video\/(\d+)/)?.[1]
    const videoId = idFromEmbed ?? directId

    if (!videoId) return null

    return {
      videoId,
      thumbnailUrl: data.thumbnail_url ?? '',
    }
  }
  catch {
    if (directId) {
      return {
        videoId: directId,
        thumbnailUrl: '',
      }
    }
    return null
  }
}

export async function parseExternalVideoUrl(url: string): Promise<ParsedExternalVideo> {
  const trimmed = url.trim()

  if (!isLikelyExternalVideoUrl(trimmed)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Solo se aceptan enlaces de YouTube o TikTok',
    })
  }

  const youtubeId = extractYoutubeId(trimmed)
  if (youtubeId) {
    return {
      provider: 'youtube',
      videoUrl: trimmed,
      videoId: youtubeId,
      thumbnailUrl: youtubeThumbnail(youtubeId),
      embedUrl: getVideoEmbedUrl('youtube', youtubeId),
    }
  }

  const tiktok = await resolveTikTokVideo(trimmed)
  if (!tiktok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL de TikTok inválida o no se pudo resolver',
    })
  }

  return {
    provider: 'tiktok',
    videoUrl: trimmed,
    videoId: tiktok.videoId,
    thumbnailUrl: tiktok.thumbnailUrl,
    embedUrl: getVideoEmbedUrl('tiktok', tiktok.videoId),
  }
}

export function resolveVideoThumbnail(
  provider: VideoProvider,
  videoId: string,
  storedThumbnail?: string | null,
) {
  if (storedThumbnail) return storedThumbnail
  if (provider === 'youtube') return youtubeThumbnail(videoId)
  return ''
}
