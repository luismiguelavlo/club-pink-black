import 'dotenv/config'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

const results = []

function log(name, ok, detail = '') {
  results.push({ name, ok })
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`)
}

function makeClient(label) {
  let cookie = ''
  return {
    label,
    async request(path, options = {}) {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
          ...(options.headers ?? {}),
        },
      })
      const setCookie = res.headers.getSetCookie?.() ?? []
      if (setCookie.length) {
        cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
      }
      const text = await res.text()
      let body
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text
      }
      return { status: res.status, body }
    },
    async login(email, password) {
      return this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },
  }
}

const admin = makeClient('admin')
const rider = makeClient('rider')
const guest = makeClient('guest')
const guest2 = makeClient('guest2')

// --- Setup: four logged-in users ---
const adminLogin = await admin.login('admin@club.com', 'Admin123!')
log('Login admin', adminLogin.status === 200, `status ${adminLogin.status}`)

const riderLogin = await rider.login('rider@club.com', 'Rider123!')
log('Login rider', riderLogin.status === 200, `status ${riderLogin.status}`)

// Extra players are created through invites so we control their credentials.
async function registerGuest(client, label) {
  const email = `party-${label}-${Date.now()}@example.com`
  const invite = await admin.request('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ email, role: 'user' }),
  })
  const inviteCode = invite.body?.invite?.code
  const accept = await client.request(`/api/invites/${inviteCode}/accept`, {
    method: 'POST',
    body: JSON.stringify({
      name: `Invitado ${label}`,
      email,
      password: 'Guest123!',
      motorcycle: 'Test',
    }),
  })
  log(`Registrar jugador extra (${label})`, accept.status === 200, `status ${accept.status}`)
}

await registerGuest(guest, 'uno')
await registerGuest(guest2, 'dos')

// --- 1. Create room ---
const created = await admin.request('/api/games/rooms', {
  method: 'POST',
  body: JSON.stringify({ gameType: 'mentiroso' }),
})
const code = created.body?.room?.code
log('Admin crea sala', created.status === 200 && Boolean(code), code ?? `status ${created.status}`)

// --- 2. Room shows up in the public list while waiting ---
const listWaiting = await rider.request('/api/games/rooms?gameType=mentiroso')
const listedWaiting = listWaiting.body?.rooms?.find((r) => r.code === code)
log(
  'Sala aparece en el listado como "esperando"',
  listWaiting.status === 200 && listedWaiting?.status === 'lobby',
  `status=${listedWaiting?.status} jugadores=${listedWaiting?.playerCount}`,
)

// --- 3. Join while in lobby -> active player ---
const joinLobby = await rider.request('/api/games/rooms/join', {
  method: 'POST',
  body: JSON.stringify({ code, gameType: 'mentiroso' }),
})
log(
  'Rider se une en lobby como jugador activo',
  joinLobby.status === 200 && joinLobby.body?.room?.waiting === false,
  `waiting=${joinLobby.body?.room?.waiting}`,
)

// --- 4. Start the match ---
const start = await admin.request(`/api/games/rooms/${code}/start`, { method: 'POST' })
log('Admin inicia la partida', start.status === 200 && start.body?.room?.status === 'playing', `status ${start.body?.room?.status}`)

// --- 5. Room is listed as in-progress ---
const listPlaying = await guest.request('/api/games/rooms?gameType=mentiroso')
const listedPlaying = listPlaying.body?.rooms?.find((r) => r.code === code)
log(
  'Sala aparece en el listado como "en curso"',
  listedPlaying?.status === 'playing' && listedPlaying?.full === false,
  `status=${listedPlaying?.status} ronda=${listedPlaying?.round}`,
)

// --- 6. Join mid-match -> waiting player ---
const joinMid = await guest.request('/api/games/rooms/join', {
  method: 'POST',
  body: JSON.stringify({ code, gameType: 'mentiroso' }),
})
log(
  'Invitado se une con partida en curso y queda en espera',
  joinMid.status === 200 && joinMid.body?.room?.waiting === true,
  `waiting=${joinMid.body?.room?.waiting}`,
)

// --- 7. Waiting player sees the room and is excluded from the match ---
const guestView = await guest.request(`/api/games/rooms/${code}`)
log(
  'Espectador ve la sala sin contar como jugador',
  guestView.status === 200
    && guestView.body?.room?.me?.waiting === true
    && guestView.body?.room?.players?.length === 2
    && guestView.body?.room?.waitingPlayers?.length === 1,
  `players=${guestView.body?.room?.players?.length} waiting=${guestView.body?.room?.waitingPlayers?.length}`,
)

// --- 8. Waiting player can chat ---
const chat = await guest.request(`/api/games/rooms/${code}/chat`, {
  method: 'POST',
  body: JSON.stringify({ text: 'Hola, espero la próxima partida' }),
})
log(
  'Espectador puede escribir en el chat',
  chat.status === 200 && chat.body?.room?.chatMessages?.some((m) => m.text.includes('espero la próxima')),
  `status ${chat.status}`,
)

// --- 9. Waiting player cannot play the current match ---
const blockedAction = await guest.request(`/api/games/rooms/${code}/action`, {
  method: 'POST',
  body: JSON.stringify({ type: 'submit_answer', text: 'respuesta falsa' }),
})
log(
  'Espectador no puede actuar en la partida en curso',
  blockedAction.status === 403,
  `status ${blockedAction.status}`,
)

// --- 10. Waiting player does not appear to the active players either ---
const adminView = await admin.request(`/api/games/rooms/${code}`)
log(
  'Jugadores activos no ven al espectador como rival',
  adminView.body?.room?.players?.length === 2 && adminView.body?.room?.waitingPlayers?.length === 1,
  `players=${adminView.body?.room?.players?.length}`,
)

// --- 11. A second spectator joins, so two people are waiting for the next match ---
const joinMid2 = await guest2.request('/api/games/rooms/join', {
  method: 'POST',
  body: JSON.stringify({ code, gameType: 'mentiroso' }),
})
log(
  'Segundo espectador se une con la partida en curso',
  joinMid2.status === 200 && joinMid2.body?.room?.waiting === true,
  `waiting=${joinMid2.body?.room?.waiting}`,
)

// --- 12. End the match and verify promotion on the next one ---
await rider.request(`/api/games/rooms/${code}/leave`, { method: 'POST' })
const adminLeave = await admin.request(`/api/games/rooms/${code}/leave`, { method: 'POST' })
const guestAfterLeave = await guest.request(`/api/games/rooms/${code}`)
log(
  'La partida termina cuando salen los jugadores activos',
  adminLeave.status === 200 && guestAfterLeave.body?.room?.status === 'finished',
  `status=${guestAfterLeave.body?.room?.status}`,
)

// The first spectator inherited the host role when the original players left.
const restart = await guest.request(`/api/games/rooms/${code}/start`, { method: 'POST' })
const promoted = restart.body?.room?.players ?? []
log(
  'Al iniciar la siguiente partida los espectadores ya juegan',
  restart.status === 200
    && restart.body?.room?.status === 'playing'
    && promoted.length === 2
    && promoted.every((p) => !p.waiting)
    && (restart.body?.room?.waitingPlayers?.length ?? 0) === 0,
  `jugadores=${promoted.length} enEspera=${restart.body?.room?.waitingPlayers?.length}`,
)

const guestAfterRestart = await guest.request(`/api/games/rooms/${code}`)
log(
  'El antiguo espectador puede jugar la nueva partida',
  guestAfterRestart.body?.room?.me?.waiting === false && guestAfterRestart.body?.room?.me?.alive === true,
  `waiting=${guestAfterRestart.body?.room?.me?.waiting}`,
)

const nowPlays = await guest.request(`/api/games/rooms/${code}/action`, {
  method: 'POST',
  body: JSON.stringify({ type: 'submit_answer', text: 'ahora si juego' }),
})
log('El antiguo espectador ya puede enviar acciones', nowPlays.status === 200, `status ${nowPlays.status}`)

// --- 13. A full room rejects new players ---
const listFinal = await rider.request('/api/games/rooms?gameType=mentiroso')
const listedFinal = listFinal.body?.rooms?.find((r) => r.code === code)
log(
  'El listado refleja la sala reiniciada',
  listedFinal?.status === 'playing' && listedFinal?.playerCount === 2 && listedFinal?.waitingCount === 0,
  `jugadores=${listedFinal?.playerCount} enEspera=${listedFinal?.waitingCount}`,
)

// --- Cleanup ---
await guest.request(`/api/games/rooms/${code}/leave`, { method: 'POST' })
await guest2.request(`/api/games/rooms/${code}/leave`, { method: 'POST' })

const failed = results.filter((r) => !r.ok)
console.log(`\n=== Resumen: ${results.length - failed.length}/${results.length} OK ===`)
if (failed.length) {
  console.log('\nFallos:')
  for (const f of failed) console.log(` - ${f.name}`)
  process.exitCode = 1
}
