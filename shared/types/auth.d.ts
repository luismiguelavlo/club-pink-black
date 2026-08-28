declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    motorcycle?: string | null
    avatarUrl?: string | null
    isActive?: boolean
  }

  interface UserSession {
    // Extended session fields can go here
  }
}

export {}
