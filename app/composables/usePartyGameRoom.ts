import type { PartyGameAction, PartyRoomView } from '#shared/types/party-games'

export function usePartyGameRoom(code: string) {
  const room = ref<PartyRoomView | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const data = await $fetch<{ room: PartyRoomView }>(`/api/games/rooms/${code}`)
      room.value = data.room
      error.value = null
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string }; statusMessage?: string }
      error.value = fetchError.data?.message ?? fetchError.statusMessage ?? 'Error al cargar la sala'
    } finally {
      loading.value = false
    }
  }

  async function sendAction(action: PartyGameAction) {
    const data = await $fetch<{ room: PartyRoomView }>(`/api/games/rooms/${code}/action`, {
      method: 'POST',
      body: action,
    })
    room.value = data.room
    return data.room
  }

  async function startGame() {
    const data = await $fetch<{ room: PartyRoomView }>(`/api/games/rooms/${code}/start`, {
      method: 'POST',
    })
    room.value = data.room
    return data.room
  }

  async function leaveRoom() {
    try {
      await $fetch(`/api/games/rooms/${code}/leave`, { method: 'POST' })
    } catch {
      // ignore
    }
  }

  function startPolling(intervalMs = 1200) {
    stopPolling()
    pollTimer = setInterval(() => {
      refresh()
    }, intervalMs)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onMounted(async () => {
    await refresh()
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    room,
    loading,
    error,
    refresh,
    sendAction,
    startGame,
    leaveRoom,
    startPolling,
    stopPolling,
  }
}
