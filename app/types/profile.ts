export type ProfileGalleryImage = {
  id: string
  imageUrl: string
  sortOrder: number
  createdAt: string
}

export type UserProfile = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
  bio: string | null
  postsCount: number
  galleryCount: number
  memberSince: string
  isOwnProfile: boolean
  isPublic: boolean
  isPrivateView: boolean
  gallery: ProfileGalleryImage[]
}

export type ClubMemberPreview = {
  id: string
  name: string
  role: 'admin' | 'user'
  motorcycle: string | null
  avatarUrl: string | null
  isPublic: boolean
  postsCount: number
}

export type ProfileFeedPost = {
  id: string
  body: string
  createdAt: string
  images: { id: string; imageUrl: string; sortOrder: number }[]
  commentsCount: number
  ignitesCount: number
}
