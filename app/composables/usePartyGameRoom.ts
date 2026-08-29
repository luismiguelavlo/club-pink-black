import type { PartyGameAction, PartyRoomView } from '#shared/types/party-games'

export function usePartyGameRoom(code: string) {
  const room = ref<PartyRoomView | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const errorStatus = ref<number | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const data = await $fetch<{ room: PartyRoomView }>(`/api/games/rooms/${code}`)
      room.value = data.room
      error.value = null
      errorStatus.value = null
    }
    catch (err: unknown) {
      const e = err as { data?: { statusCode?: number; statusMessage?: string; message?: string }; status?: number; statusMessage?: string }
      errorStatus.value = e.data?.statusCode ?? e.status ?? null
      error.value = e.data?.statusMessage ?? e.data?.message ?? e.statusMessage ?? 'Error al cargar la sala'
    }
    finally {
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

  async function sendChatMessage(text: string) {
    const data = await $fetch<{ room: PartyRoomView }>(`/api/games/rooms/${code}/chat`, {
      method: 'POST',
      body: { text },
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
    errorStatus,
    refresh,
    sendAction,
    sendChatMessage,
    startGame,
    leaveRoom,
    startPolling,
    stopPolling,
  }
}
