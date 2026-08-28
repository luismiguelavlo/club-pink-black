import {
  DEFAULT_CONFIG,
  type ChallengeCategory,
  type LocalGameId,
  type NoTeRiasMode,
  type PartyChaosConfig,
  type PartyChaosPlayer,
} from '~/types/party-chaos'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function usePartyChaos() {
  const players = useState<PartyChaosPlayer[]>('party-chaos-players', () => [])
  const config = useState<PartyChaosConfig>('party-chaos-config', () => ({
    ...DEFAULT_CONFIG,
    categories: [...DEFAULT_CONFIG.categories],
    noTeRiasModes: [...DEFAULT_CONFIG.noTeRiasModes],
  }))
  const activeGame = useState<LocalGameId | null>('party-chaos-game', () => null)
  const round = useState('party-chaos-round', () => 0)

  function resetSession() {
    players.value = []
    round.value = 0
    activeGame.value = null
    config.value = {
      ...DEFAULT_CONFIG,
      categories: [...DEFAULT_CONFIG.categories],
      noTeRiasModes: [...DEFAULT_CONFIG.noTeRiasModes],
    }
  }

  function addPlayer(name: string) {
    const trimmed = name.trim()
    if (!trimmed || players.value.length >= 8) return false
    if (players.value.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return false
    players.value.push({
      id: uid(),
      name: trimmed,
      points: 0,
      lives: config.value.startingLives,
      streak: 0,
    })
    return true
  }

  function removePlayer(id: string) {
    players.value = players.value.filter((p) => p.id !== id)
  }

  function startGame(gameId: LocalGameId) {
    if (players.value.length < 2) return false
    players.value = players.value.map((p) => ({
      ...p,
      points: 0,
      lives: config.value.startingLives,
      streak: 0,
    }))
    activeGame.value = gameId
    round.value = 1
    return true
  }

  function getPlayer(id: string) {
    return players.value.find((p) => p.id === id)
  }

  function loseLife(playerId: string) {
    const p = getPlayer(playerId)
    if (!p) return
    p.lives = Math.max(0, p.lives - 1)
    p.streak = 0
  }

  function addPoints(playerId: string, amount: number) {
    const p = getPlayer(playerId)
    if (!p) return
    p.points += amount
    if (amount > 0) p.streak += 1
    else p.streak = 0
  }

  function addStreakBonus(playerId: string) {
    const p = getPlayer(playerId)
    if (!p || p.streak < 2) return
    p.points += p.streak
  }

  function alivePlayers() {
    return players.value.filter((p) => p.lives > 0)
  }

  function leader() {
    return [...players.value].sort((a, b) => b.points - a.points || b.lives - a.lives)[0]
  }

  function toggleCategory(cat: ChallengeCategory) {
    const cats = config.value.categories
    if (cats.includes(cat)) {
      config.value.categories = cats.filter((c) => c !== cat)
    } else {
      config.value.categories = [...cats, cat]
    }
  }

  function toggleNoTeRiasMode(mode: NoTeRiasMode) {
    const modes = config.value.noTeRiasModes
    if (modes.includes(mode)) {
      config.value.noTeRiasModes = modes.filter((m) => m !== mode)
    } else {
      config.value.noTeRiasModes = [...modes, mode]
    }
  }

  function nextRound() {
    round.value += 1
  }

  function isGameOver() {
    return alivePlayers().length <= 1 || round.value > config.value.totalRounds
  }

  return {
    players,
    config,
    activeGame,
    round,
    resetSession,
    addPlayer,
    removePlayer,
    startGame,
    getPlayer,
    loseLife,
    addPoints,
    addStreakBonus,
    alivePlayers,
    leader,
    toggleCategory,
    toggleNoTeRiasMode,
    nextRound,
    isGameOver,
  }
}
