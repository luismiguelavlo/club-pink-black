export type MemberNavItem = {
  label: string
  href: string
  icon: string
  match: (path: string) => boolean
}

const memberNav: MemberNavItem[] = [
  {
    label: 'Juegos',
    href: '/games',
    icon: 'videogame_asset',
    match: (path) => path.startsWith('/games'),
  },
  {
    label: 'Feed social',
    href: '/feed',
    icon: 'forum',
    match: (path) => path.startsWith('/feed'),
  },
  {
    label: 'Miembros',
    href: '/members',
    icon: 'groups',
    match: (path) => path.startsWith('/members'),
  },
  {
    label: 'Mi perfil',
    href: '/profile',
    icon: 'account_circle',
    match: (path) => path.startsWith('/profile'),
  },
  {
    label: 'Rodadas',
    href: '/rides',
    icon: 'event',
    match: (path) => path.startsWith('/rides'),
  },
  {
    label: 'Mi garaje',
    href: '/garage',
    icon: 'two_wheeler',
    match: (path) => path.startsWith('/garage'),
  },
]

const adminNav: MemberNavItem[] = [
  {
    label: 'Crear rodada',
    href: '/admin/rodadas',
    icon: 'edit_calendar',
    match: (path) => path.startsWith('/admin/rodadas'),
  },
  {
    label: 'Pilotos e invitaciones',
    href: '/admin/pilots',
    icon: 'group_add',
    match: (path) => path.startsWith('/admin/pilots'),
  },
  {
    label: 'Solicitudes',
    href: '/admin/solicitudes',
    icon: 'inbox',
    match: (path) => path.startsWith('/admin/solicitudes'),
  },
  {
    label: 'Multimedia',
    href: '/admin/multimedia',
    icon: 'gallery_thumbnail',
    match: (path) => path.startsWith('/admin/multimedia'),
  },
  {
    label: 'Labores sociales',
    href: '/admin/labores-sociales',
    icon: 'volunteer_activism',
    match: (path) => path.startsWith('/admin/labores-sociales'),
  },
]

const settingsNav: MemberNavItem = {
  label: 'Ajustes',
  href: '/settings',
  icon: 'settings_input_component',
  match: (path) => path.startsWith('/settings'),
}

/** Sidebar order: member links → admin links (if admin) → Ajustes always last. */
export function getMemberSidebarNav(isAdmin: boolean): MemberNavItem[] {
  const items = [...memberNav]

  if (isAdmin) {
    items.push(...adminNav)
  }

  items.push(settingsNav)

  return items
}
