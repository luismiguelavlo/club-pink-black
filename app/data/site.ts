import type {
  ArchiveMediaItem,
  ClubEvent,
  FooterLink,
  GalleryFilter,
  GalleryItem,
  NavLink,
  StatItem,
  FilterOption,
  EventFilter,
} from '~/types/site'

export const brandName = 'PINK & BLACK'

export const navLinks: NavLink[] = [
  { label: 'Philosophy', href: '/#philosophy' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Events', href: '/events' },
]

export function getNavLinks(activeLabel?: string): NavLink[] {
  return navLinks.map((link) => ({
    ...link,
    active: activeLabel ? link.label === activeLabel : false,
  }))
}

/** Active nav link according to the current route. */
export function getNavLinksForPath(path: string): NavLink[] {
  const activeLabel =
    path.startsWith('/gallery')
      ? 'Gallery'
      : path.startsWith('/events')
        ? 'Events'
        : 'Philosophy'

  return getNavLinks(activeLabel)
}


export const heroContent = {
  title: 'DOMINA EL ASFALTO',
  subtitle:
    'La noche es nuestro territorio. Velocidad, hermandad y el rugir de los motores bajo la luz de neón.',
  ctaLabel: 'Descubre el Club',
  ctaHref: '/gallery',
  backgroundImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAOqx2oFwPVfGNpAwz-M2a2NksurRtSlmuAOt5Roa-0HP2ppyJeaKz-gzAOmR_oD76l3g-Jh2Nb6Kjm0zN_0EtpATSluUjxT3VWqLJCZ-fJge5fPidsQFsaTE21gdqjja7-1iM7F8eNxKLLCe7mgWVyXZiS_iKhGENn_AKgRnVuvBrqLAi4U3y0die07ozEY1PpaJRVuTmujb4faJjr1-PTCsp0CWWag7n9Q9r2tdHEQDnXnadQ5I9YfQ',
  backgroundAlt:
    'Grupo de motos modernas rodando por una autopista urbana nocturna iluminada con neón rosa',
} as const

export const clubLogo = {
  src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCxbfObxIwzFDfCZacB6LNhGdhKyf1c2OuKb2I2bAtVwzjH7H--OdAs02Akm2p-52Y_5pJ6jn1bsQy1VipLd9YXUYd8l8gfeypwBWtVeLSlREs0-_CQgPwP5gLmtuIkoAVTo7JRZTJGVH6LCAbMYSg6dpriTmebgeud2bMFWNxR8vuX-BRQHC8Z2KX-N3hwW17RRg9oh-P5vMFwE5C-KISTnyb1t46ixnxinZ7OD4vmfS8rj4EV4aTEcdDxauI2kHXkLw',
  alt: 'Logo del club Pink & Black',
} as const

export const clubStats: StatItem[] = [
  { value: '+150', label: 'Miembros', align: 'right' },
  { value: '85', label: 'Rodadas Nocturnas', align: 'right' },
  { value: '40', label: 'Eventos Realizados', align: 'left' },
  { value: '+50,000', label: 'KM Recorridos', align: 'left' },
]

export const galleryItems: GalleryItem[] = [
  {
    id: 'midnight-canyons',
    title: 'Midnight Canyons',
    badge: 'LATEST RUN',
    span: 'wide',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVuHht3FM-7knNpUBHtTp4mmBW58NAuL4EKRaPPWFkXbaGcBht3quzAK8Ohhy5TI_OW9Ydj_x2sYTymdI-YrKeeLjECQD1s8jhFtwRpH-k-xmHJYtZRf7ddj54UqamO058UwFxZSGWAHNVl_rep1iTzctu7h8nJpB3J_u6O-I2AcijOkjELYlVLrU4dTaY0uL0ZMgGwRG3VNZuE3NQ5-L9fwbyvUU3ro3wIqNHuQHIpHRKYvSRuAJbTw',
    imageAlt:
      'Moto deportiva rosa neón tomando una curva en una carretera de montaña de noche',
  },
  {
    id: 'city-meetup',
    title: 'City Meetup',
    subtitle: 'Urban Sector',
    span: 'narrow',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCTN8SGq-EMzbAN5Yyq7tYsICKIZ6qs5MBEsnS6UM4AdQP2hZ64oJ6SVZMvZyphm_ylDdHEVjdZ61p5QZFdv9lERzVpD1tvPDBOpIxCXaMDyUf5g6nb3okhUKV0NPqH2XaQEWswaataWEq5cro6Gmbc7S71m8E-rULEI_YVMKoWvgAUguDFuIbid3sabVZMp_hoEY3FAGugzTBU1CMP1o0aU_bxpF8HHVlvcoG8pVBYiRGns7O4lRBUdQ',
    imageAlt:
      'Cascos de moto apoyados sobre tanques negros bajo luz neón rosa',
  },
  {
    id: 'garage-night',
    title: 'Garage Night',
    subtitle: 'Headquarters',
    span: 'narrow',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzVGrAreJVi7igXtbojQ-p6iJQGT-SX1riU_swgjLdMRDqP4paf8fkavb7makrGcZi7MRqRXmWjyvJ_c5p2LZik740TESI3HcLineiVwyVuqWNgUh0wQe_OeuiS8EWmeVN70kUufSa8rfDmMnfOCCQ9zToYF4ePMFNw-yrfO_kCt5gh3d7ze7wbWvYJzEaGAGm3513lM_2RFZY6q6ZIsWQPMmGoLVmyxy_z0i7JbMaymlpM1J1tG-pIw',
    imageAlt:
      'Interior del garage del club con motos custom iluminadas con neón rosa',
  },
  {
    id: 'neon-vista',
    title: 'Neon Vista Run',
    span: 'wide',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBoNcJTgTbox97U89q_iToxZJwpPEE0ESd8iXSBwP5a_P6LKcgmhFMYMx10kmnRLpfXtEVmXMPqXBRcJerMuM7JS6OPi7UljiKJYQslmQQkEqSN8wHGe9XRnX9VnFb7KHt6Zy6paPEaFNfHz9QlBjCLfhplUAQ2YOOj7zqwvkfkR-hbZ41o2G9RaIEp6HTGPB_iGWZbRsZfEwLLe-6gGpZEZ1om4z4Hv_h4zXHhIlSBMQHj2tFDzcm4lQ',
    imageAlt:
      'Silueta de un piloto junto a su moto mirando una ciudad cyberpunk',
  },
]

export const archiveHero = {
  title: 'Archivo Visual',
  description:
    'Capturando la adrenalina de la carretera, el brillo del cromo bajo las luces de neón y la hermandad inquebrantable que define al Pink & Black Road Rider Club. Una crónica de libertad y velocidad.',
} as const

export const archiveFilters: { id: GalleryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'video', label: 'Videos' },
]

export const archiveMediaItems: ArchiveMediaItem[] = [
  {
    id: 'twilight-convoy',
    kind: 'photo',
    size: 'large',
    title: 'Twilight Convoy',
    badge: 'Featured Ride',
    imageUrl:
      'https://lh3.googleusercontent.com/aida/AP1WRLtxlLVaIKJVS7yxd3QyX5IOBDgC_vMHkNblls4tXvNNl_xJAUpss0GrEvC8RvYlsWIfQ9K4iC3eQiXSHoOYKBHruLdUVlxFVfpVNWJs3toiQgPQ5-azKGMnxv9fiZ7nJZDbClYShToCrJMJQsSvvOD8HVSa7tvpUUCrivRyGqwIbFb3SW_mHn59LMlo9zhH1fW7trWz4kagX6LW8Z0Du1df9OAyKOSIKpF0QYWAXBtfWvmGRjw0mQqVx21F',
    imageAlt: 'Convoy de motos al atardecer — featured ride del club',
  },
  {
    id: 'raw-engine',
    kind: 'video',
    size: 'tall',
    duration: '02:45',
    videoLabel: 'RAW ENGINE SOUND',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAdaz2xv-uV7WXbAyJcH_l7t8hsq2l9h71CGBQq6MRhO80IRTNsSVcuyH-wiaL7sENIQdMhz-potvKVYSJCjcTcq1975W0ZObw9i4WUdYs8Cds8OFKfFIGIhfCtHEcDEnjUpIbh8-uAuwsao3oDEnMV0zBg5NvlZVl0ephPGQXLhPZg9z_1pUk9PAh60p6LuHygZUDm9Edn7oPZrxCEDdrXo7OTGwTw4g1hE1zXVifIqxnCIacNtQJz8A',
    imageAlt:
      'Close-up de motor custom iluminado con neón rosa y sombras obsidiana',
  },
  {
    id: 'rider-portrait',
    kind: 'photo',
    size: 'standard',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBb6icC-SP7qfHajqYcsmcPLcbaQETZgWvw9gKgpXl8BPIKDzha724zgobPy6TA1VYv7tVZ1owCQb3CAY9oseiIBjQQpFdRmaFvGHFkbOm_V694c2Z5VY53HBgDl7ec4Z52R3SeOTShRF9GSVIQsLi8tcs3SVMUNZMa4fC2O6PmbdDhagA0BU7VYI1hpJZ6HQ4kEpIx4cYajOmEEcHQMTQ-WlDTO34nG3h4D3Ifh868iOn2CFS-YVglAw',
    imageAlt:
      'Retrato de miembro del club apoyado en su moto bajo neón urbano',
  },
  {
    id: 'tunnel-pov',
    kind: 'video',
    size: 'standard',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6aDjJ1biZBxsDAWySiyHib3jz7aqZnyAqTCC4R4PpWvLUUPqEqJdHuDyaAQK2PO13qKSsX6fTOy6Bh0UjuHVFonjetYWpzQtUS8LK8Cj4Ei66rFhePQSyO8o109FxYvkgzab4AgDhMT2Tn98Se0VQ5ovGE5ux23iWYHvlPA4EMP9OMwbmChxtiwNO5wDOuDC4VIkgvxZ184ljftzt8SjFAaKhFGnCN7WKMSW-_iy7jpAOmMtfElVGHg',
    imageAlt:
      'POV de manillar atravesando un túnel con luces neón rosa',
  },
  {
    id: 'headquarters',
    kind: 'photo',
    size: 'tall',
    caption: 'Base Headquarters',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2KU46nmxnpIIvGcnkCUtKyB2VQnxGhI3zz1NZGQQKSPH0liLcRcWlZeJkW_4apiav5usA4eQVooqPynAveFcV8xrf1gxhlLWT8oJaSq4uE2fzYCkYgCDlHCzheuX4grlPx57b9G6S1H8acxAJDyR915B2UzEhqcuEXcINIrs_GhcA2jAoPx3rjlAYowVLZQvn6gPdxSI5EOlO5-2LCpOirUEKqFv7881TAL8Az5obLvWuw-aHkQK4AQ',
    imageAlt:
      'Línea de motos aparcadas frente al club house moderno a medianoche',
  },
  {
    id: 'throttle-detail',
    kind: 'photo',
    size: 'standard',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCucGdWJthWS3EOYtgrqpLDfjU7IJlUV0fLKQbhrihorUs06FCZecR5Tic1y1C2ud3IcUVgnAxy8wgm8m4Ym20WSRzRk4Cyk9n_XDzGwzmW61KZ9WrUwQks6v0UCyElA--W50khq9D-6e91F-FPT8-hAuNw822u3bNJuaEb4jIXnKGvBhiMHREQUw5-0ElgRpvKSlPMq4B_URXUlKTEGkOTI6ei5pVKEiS8pBmE51S2qbpBOWO39eZvdQ',
    imageAlt:
      'Detalle de guante high-tech girando el acelerador bajo luz neón',
  },
  {
    id: 'mountain-lean',
    kind: 'photo',
    size: 'standard',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMiVY8Ig7SgjA3B-xUy10lOfROF2I2Vr8iDSJg1esOMIhqgFxBMD3aKDNL_Oa9bSHRu3COje2gac8s1TaveKVY9qTaNMMA3lPKjB5Vt8GoPjpMVv3QIVbkWTsu8kzu0C4y3v8tJPf-M_hKvRVC2GNAsmX_pv2Yt-ljJzX0vP8FHfLMnrAktwDjQqexcTKFC1LJFoQ5xByPP-C91YHIx-kq3whmotc9EkAGGZAD2JQfd8dchSlgOBKMDg',
    imageAlt:
      'Moto inclinada en curva de montaña con asfalto húmedo al atardecer',
  },
]

export const eventsHero = {
  title: 'Calendario de Rodadas',
  description:
    'Noches de asfalto, puntos de encuentro y rituales de garage. Consulta las próximas salidas del club y asegura tu lugar en el convoy.',
} as const

export const eventFilters: FilterOption<EventFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'night-run', label: 'Night Runs' },
  { id: 'meetup', label: 'Meetups' },
  { id: 'past', label: 'Past' },
]

export const clubEvents: ClubEvent[] = [
  {
    id: 'midnight-canyons-run',
    title: 'Midnight Canyons',
    description:
      'Rodada nocturna por cañones iluminados. Convoy cerrado, ritmo técnico y hermandad bajo neón.',
    dateLabel: '26 JUL',
    timeLabel: '22:00',
    location: 'Canyons Gate — Sector Norte',
    status: 'upcoming',
    category: 'night-run',
    featured: true,
    spotsLeft: 18,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVuHht3FM-7knNpUBHtTp4mmBW58NAuL4EKRaPPWFkXbaGcBht3quzAK8Ohhy5TI_OW9Ydj_x2sYTymdI-YrKeeLjECQD1s8jhFtwRpH-k-xmHJYtZRf7ddj54UqamO058UwFxZSGWAHNVl_rep1iTzctu7h8nJpB3J_u6O-I2AcijOkjELYlVLrU4dTaY0uL0ZMgGwRG3VNZuE3NQ5-L9fwbyvUU3ro3wIqNHuQHIpHRKYvSRuAJbTw',
    imageAlt: 'Moto neón rosa en curva de montaña de noche',
  },
  {
    id: 'city-meetup-july',
    title: 'City Meetup',
    description:
      'Encuentro urbano para nuevos riders. Briefing rápido, foto de pack y salida corta por el centro.',
    dateLabel: '02 AUG',
    timeLabel: '21:30',
    location: 'Urban Sector — Neon Diner',
    status: 'upcoming',
    category: 'meetup',
    spotsLeft: 32,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCTN8SGq-EMzbAN5Yyq7tYsICKIZ6qs5MBEsnS6UM4AdQP2hZ64oJ6SVZMvZyphm_ylDdHEVjdZ61p5QZFdv9lERzVpD1tvPDBOpIxCXaMDyUf5g6nb3okhUKV0NPqH2XaQEWswaataWEq5cro6Gmbc7S71m8E-rULEI_YVMKoWvgAUguDFuIbid3sabVZMp_hoEY3FAGugzTBU1CMP1o0aU_bxpF8HHVlvcoG8pVBYiRGns7O4lRBUdQ',
    imageAlt: 'Cascos sobre tanques bajo luz neón rosa',
  },
  {
    id: 'garage-night-aug',
    title: 'Garage Night',
    description:
      'Sesión de mantenimiento, swaps y música. Trae tu máquina; la familia trae las herramientas.',
    dateLabel: '09 AUG',
    timeLabel: '20:00',
    location: 'HQ Garage — Headquarters',
    status: 'upcoming',
    category: 'garage',
    spotsLeft: 40,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzVGrAreJVi7igXtbojQ-p6iJQGT-SX1riU_swgjLdMRDqP4paf8fkavb7makrGcZi7MRqRXmWjyvJ_c5p2LZik740TESI3HcLineiVwyVuqWNgUh0wQe_OeuiS8EWmeVN70kUufSa8rfDmMnfOCCQ9zToYF4ePMFNw-yrfO_kCt5gh3d7ze7wbWvYJzEaGAGm3513lM_2RFZY6q6ZIsWQPMmGoLVmyxy_z0i7JbMaymlpM1J1tG-pIw',
    imageAlt: 'Garage del club con motos bajo neón rosa',
  },
  {
    id: 'neon-vista-live',
    title: 'Neon Vista Run',
    description:
      'Convoy en vivo rumbo al mirador. Última llamada para unirte al pack.',
    dateLabel: 'HOY',
    timeLabel: '23:15',
    location: 'Vista Ridge — Overlook',
    status: 'live',
    category: 'night-run',
    spotsLeft: 6,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBoNcJTgTbox97U89q_iToxZJwpPEE0ESd8iXSBwP5a_P6LKcgmhFMYMx10kmnRLpfXtEVmXMPqXBRcJerMuM7JS6OPi7UljiKJYQslmQQkEqSN8wHGe9XRnX9VnFb7KHt6Zy6paPEaFNfHz9QlBjCLfhplUAQ2YOOj7zqwvkfkR-hbZ41o2G9RaIEp6HTGPB_iGWZbRsZfEwLLe-6gGpZEZ1om4z4Hv_h4zXHhIlSBMQHj2tFDzcm4lQ',
    imageAlt: 'Piloto en silueta frente a ciudad cyberpunk',
  },
  {
    id: 'twilight-convoy-past',
    title: 'Twilight Convoy',
    description:
      'Salida archivada. Un convoy al atardecer que marcó el ritmo de la temporada.',
    dateLabel: '12 JUL',
    timeLabel: '19:45',
    location: 'West Loop — Start Line',
    status: 'past',
    category: 'tour',
    imageUrl:
      'https://lh3.googleusercontent.com/aida/AP1WRLtxlLVaIKJVS7yxd3QyX5IOBDgC_vMHkNblls4tXvNNl_xJAUpss0GrEvC8RvYlsWIfQ9K4iC3eQiXSHoOYKBHruLdUVlxFVfpVNWJs3toiQgPQ5-azKGMnxv9fiZ7nJZDbClYShToCrJMJQsSvvOD8HVSa7tvpUUCrivRyGqwIbFb3SW_mHn59LMlo9zhH1fW7trWz4kagX6LW8Z0Du1df9OAyKOSIKpF0QYWAXBtfWvmGRjw0mQqVx21F',
    imageAlt: 'Convoy Twilight del club',
  },
  {
    id: 'base-open-house',
    title: 'Base Open House',
    description:
      'Puertas abiertas en headquarters. Conoce al club, las máquinas y el código de la carretera.',
    dateLabel: '28 JUN',
    timeLabel: '18:00',
    location: 'HQ — Glass Pavilion',
    status: 'past',
    category: 'meetup',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2KU46nmxnpIIvGcnkCUtKyB2VQnxGhI3zz1NZGQQKSPH0liLcRcWlZeJkW_4apiav5usA4eQVooqPynAveFcV8xrf1gxhlLWT8oJaSq4uE2fzYCkYgCDlHCzheuX4grlPx57b9G6S1H8acxAJDyR915B2UzEhqcuEXcINIrs_GhcA2jAoPx3rjlAYowVLZQvn6gPdxSI5EOlO5-2LCpOirUEKqFv7881TAL8Az5obLvWuw-aHkQK4AQ',
    imageAlt: 'Club house moderno con motos aparcadas',
  },
]

export const contactContent = {
  title: 'Join the Revolution',
  subtitle: 'Deja tu marca en el asfalto. Únete a la familia.',
  submitLabel: 'Ignite',
} as const

export const footerLinks: FooterLink[] = [
  { label: 'Contact Us', href: '/#contact' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Ride', href: '#' },
]

export const footerTagline =
  'PINK & BLACK ROAD RIDER CLUB. PASIÓN, LIBERTAD, UNIÓN.'
