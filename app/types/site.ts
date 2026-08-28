export type NavLink = {
  label: string
  href: string
  active?: boolean
}

export type StatItem = {
  value: string
  label: string
  align: 'left' | 'right'
}

export type GalleryItem = {
  id: string
  title: string
  subtitle?: string
  badge?: string
  imageUrl: string
  imageAlt: string
  span: 'wide' | 'narrow'
}

export type MediaKind = 'photo' | 'video'

export type MasonrySize = 'standard' | 'tall' | 'large'

export type ArchiveMediaItem = {
  id: string
  kind: MediaKind
  size: MasonrySize
  imageUrl: string
  imageAlt: string
  title?: string
  badge?: string
  caption?: string
  duration?: string
  videoLabel?: string
}

export type GalleryFilter = 'all' | MediaKind

export type EventStatus = 'upcoming' | 'live' | 'past'

export type EventCategory = 'night-run' | 'meetup' | 'garage' | 'tour'

export type EventFilter = 'all' | EventStatus | EventCategory

export type ClubEvent = {
  id: string
  title: string
  description: string
  dateLabel: string
  timeLabel: string
  location: string
  status: EventStatus
  category: EventCategory
  imageUrl: string
  imageAlt: string
  spotsLeft?: number
  featured?: boolean
}

export type FilterOption<T extends string = string> = {
  id: T
  label: string
}

export type FooterLink = {
  label: string
  href: string
}

export type JoinFormPayload = {
  name: string
  machine: string
  email: string
}

export type SocialWorkPreview = {
  id: string
  title: string
  description: string
  coverImageUrl: string | null
  imageCount: number
  videoCount: number
  publishedAt: string | null
}
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonShape = 'rounded' | 'chamfer' | 'pill'
