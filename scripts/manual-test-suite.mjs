import 'dotenv/config'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3001'

const results = []
let cookie = ''

function log(area, name, ok, detail = '') {
  results.push({ area, name, ok, detail })
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${area} / ${name}${detail ? ` — ${detail}` : ''}`)
}

async function json(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...(options.headers ?? {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: res.status, body, headers: res.headers }
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookie = res.headers.getSetCookie?.() ?? []
  cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
  const body = await res.json()
  return { status: res.status, body, hasCookie: Boolean(cookie) }
}

// --- Public APIs ---
async function testPublic() {
  const endpoints = [
    ['/api/public/gallery?limit=2', (b) => Array.isArray(b.items)],
    ['/api/public/media?limit=2', (b) => Array.isArray(b.items)],
    ['/api/public/rodadas', (b) => Array.isArray(b.events)],
    ['/api/public/labores-sociales?limit=2', (b) => Array.isArray(b.items)],
    ['/api/public/labores-sociales/archivo?limit=2', (b) => Array.isArray(b.items)],
  ]

  for (const [path, check] of endpoints) {
    const { status, body } = await json(path)
    log('Public API', path.split('?')[0], status === 200 && check(body), `status ${status}`)
  }

  const contact = await json('/api/public/contact', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Manual',
      email: `test-manual-${Date.now()}@example.com`,
      machine: 'Test Bike',
    }),
  })
  log('Public API', 'POST /api/public/contact', contact.status === 200, `status ${contact.status}`)
}

// --- Auth ---
async function testAuth() {
  const badLogin = await login('admin@club.com', 'wrong-password')
  log('Auth', 'Login rechaza contraseña incorrecta', badLogin.status === 401, `status ${badLogin.status}`)

  const adminLogin = await login('admin@club.com', 'Admin123!')
  log('Auth', 'Login admin', adminLogin.status === 200 && adminLogin.hasCookie, `status ${adminLogin.status}`)

  const me = await json('/api/auth/me')
  log('Auth', 'GET /api/auth/me', me.status === 200 && me.body?.user?.role === 'admin', me.body?.user?.email ?? '')

  const logout = await json('/api/auth/logout', { method: 'POST' })
  log('Auth', 'POST /api/auth/logout', logout.status === 200, `status ${logout.status}`)
}

// --- Admin ---
async function testAdmin() {
  await login('admin@club.com', 'Admin123!')

  const invitesList = await json('/api/admin/invites')
  log(
    'Admin',
    'GET /api/admin/invites',
    invitesList.status === 200 && Array.isArray(invitesList.body?.invites),
    `pilots ${invitesList.body?.pilots?.length ?? 0}`,
  )

  const createInvite = await json('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ email: '', role: 'user' }),
  })
  const inviteCode = createInvite.body?.invite?.code
  log(
    'Admin',
    'POST /api/admin/invites',
    createInvite.status === 200 && Boolean(inviteCode),
    inviteCode ?? `status ${createInvite.status}`,
  )

  const createRodada = await json('/api/rodadas', {
    method: 'POST',
    body: JSON.stringify({
      title: `Rodada prueba ${Date.now()}`,
      description: 'Prueba manual automatizada',
      startsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      location: 'CDMX',
      difficulty: 'pro',
      status: 'published',
    }),
  })
  const rodadaId = createRodada.body?.event?.id
  log(
    'Admin',
    'POST /api/rodadas',
    createRodada.status === 200 && Boolean(rodadaId),
    rodadaId ?? `status ${createRodada.status}`,
  )

  const labores = await json('/api/admin/labores-sociales')
  log(
    'Admin',
    'GET /api/admin/labores-sociales',
    labores.status === 200 && Array.isArray(labores.body?.items),
    `items ${labores.body?.items?.length ?? 0}`,
  )

  const createLabor = await json('/api/admin/labores-sociales', {
    method: 'POST',
    body: JSON.stringify({
      title: `Labor social prueba ${Date.now()}`,
      description: 'Descripción de prueba manual para verificar el módulo.',
      status: 'published',
    }),
  })
  const laborId = createLabor.body?.post?.id
  log(
    'Admin',
    'POST /api/admin/labores-sociales',
    createLabor.status === 200 && Boolean(laborId),
    laborId ?? `status ${createLabor.status}`,
  )

  if (laborId) {
    const publicLabor = await json(`/api/public/labores-sociales/${laborId}`)
    log(
      'Public API',
      'GET labor social por id',
      publicLabor.status === 200 && publicLabor.body?.post?.id === laborId,
      `status ${publicLabor.status}`,
    )
    await json(`/api/admin/labores-sociales/${laborId}`, { method: 'DELETE' })
  }

  const media = await json('/api/admin/media')
  log(
    'Admin',
    'GET /api/admin/media',
    media.status === 200 && Array.isArray(media.body?.items),
    `items ${media.body?.items?.length ?? 0}`,
  )

  if (rodadaId) {
    await json(`/api/rodadas/${rodadaId}`, { method: 'DELETE' })
  }
}

// --- Member (rider) ---
async function testMember() {
  await login('rider@club.com', 'Rider123!')

  const feed = await json('/api/feed')
  log('Member', 'GET /api/feed', feed.status === 200 && Array.isArray(feed.body?.posts), `posts ${feed.body?.posts?.length ?? 0}`)

  const post = await json('/api/feed/posts', {
    method: 'POST',
    body: JSON.stringify({ body: `Post de prueba manual ${Date.now()}` }),
  })
  const postId = post.body?.post?.id
  log('Member', 'POST /api/feed/posts (texto)', post.status === 200 && Boolean(postId), postId ?? `status ${post.status}`)

  const rodadas = await json('/api/rodadas')
  log('Member', 'GET /api/rodadas', rodadas.status === 200, `events ${rodadas.body?.events?.length ?? 0}`)

  const profile = await json('/api/me', {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Rider', motorcycle: 'Test Moto' }),
  })
  log('Member', 'PATCH /api/me', profile.status === 200, profile.body?.user?.motorcycle ?? '')

  const badPassword = await json('/api/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: 'wrong-password', newPassword: 'Rider1234!' }),
  })
  log(
    'Member',
    'POST /api/me/password rechaza contraseña incorrecta',
    badPassword.status === 400,
    `status ${badPassword.status}`,
  )

  const changePassword = await json('/api/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: 'Rider123!', newPassword: 'Rider1234!' }),
  })
  log(
    'Member',
    'POST /api/me/password',
    changePassword.status === 200 && changePassword.body?.ok === true,
    changePassword.body?.message ?? `status ${changePassword.status}`,
  )

  await login('rider@club.com', 'Rider1234!')
  const loginNew = await json('/api/auth/me')
  log('Member', 'Login con nueva contraseña', loginNew.status === 200, loginNew.body?.user?.email ?? '')

  const revertPassword = await json('/api/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword: 'Rider1234!', newPassword: 'Rider123!' }),
  })
  log('Member', 'Revertir contraseña de prueba', revertPassword.status === 200, `status ${revertPassword.status}`)

  const notifications = await json('/api/notifications')
  log(
    'Member',
    'GET /api/notifications',
    notifications.status === 200 && Array.isArray(notifications.body?.items),
    `count ${notifications.body?.items?.length ?? 0}`,
  )

  if (postId) {
    await json(`/api/feed/posts/${postId}`, { method: 'DELETE' })
  }
}

// --- Invite preview ---
async function testInvitePreview() {
  await login('admin@club.com', 'Admin123!')
  const createInvite = await json('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ email: `invite-test-${Date.now()}@example.com`, role: 'user' }),
  })
  const code = createInvite.body?.invite?.code
  if (!code) {
    log('Invite', 'Preview invitación', false, 'no se generó código')
    return
  }

  cookie = ''
  const preview = await json(`/api/invites/${code}`)
  log(
    'Invite',
    'GET /api/invites/:code',
    preview.status === 200 && preview.body?.invite?.code === code,
    code,
  )
}

// --- Pages smoke (HTTP 200) ---
async function testPages() {
  const pages = ['/', '/gallery', '/rodadas', '/labores-sociales', '/login', '/feed', '/rides', '/settings', '/admin/pilots', '/admin/rodadas', '/admin/multimedia', '/admin/labores-sociales']

  for (const path of pages) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    })
    const ok = res.status === 200 || res.status === 302
    log('Pages', path, ok, `status ${res.status}`)
  }
}

console.log(`\n=== Manual test suite @ ${BASE} ===\n`)

try {
  await testPublic()
  await testAuth()
  await testAdmin()
  await testMember()
  await testInvitePreview()
  await testPages()
} catch (error) {
  console.error('Suite crashed:', error)
  process.exitCode = 1
}

const failed = results.filter((r) => !r.ok)
console.log(`\n=== Resumen: ${results.length - failed.length}/${results.length} OK ===`)
if (failed.length) {
  console.log('\nFallos:')
  for (const f of failed) console.log(` - ${f.area} / ${f.name}: ${f.detail}`)
  process.exitCode = 1
}
