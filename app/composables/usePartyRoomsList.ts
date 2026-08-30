import type { PartyGameId, PartyRoomSummary } from '#shared/types/party-games'

/**
 * Live list of open party rooms. Polls on a slower cadence than the in-room
 * sync because a lobby list only needs to feel fresh, not frame-accurate.
 */
export function usePartyRoomsList(gameType?: PartyGameId, intervalMs = 5000) {
  const rooms = ref<PartyRoomSummary[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const data = await $fetch<{ rooms: PartyRoomSummary[] }>('/api/games/rooms', {
        query: gameType ? { gameType } : undefined,
      })
      rooms.value = data.rooms
      error.value = null
    }
    catch (err: unknown) {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      error.value = e.data?.statusMessage ?? e.statusMessage ?? 'No se pudieron cargar las salas'
    }
    finally {
      loading.value = false
    }
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer = setInterval(refresh, intervalMs)
  }

  const playingRooms = computed(() => rooms.value.filter((r) => r.status === 'playing'))
  const openRooms = computed(() => rooms.value.filter((r) => r.status !== 'playing'))

  onMounted(async () => {
    await refresh()
    startPolling()
  })

  onUnmounted(stopPolling)

  return {
    rooms,
    playingRooms,
    openRooms,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
  }
}
