export function usePartySounds() {
  const enabled = useState('party-sounds-enabled', () => true)
  let audioCtx: AudioContext | null = null

  function getCtx(): AudioContext | null {
    if (!import.meta.client) return null
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  }

  function tone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
  ) {
    if (!enabled.value) return
    const ctx = getCtx()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  function tick() {
    tone(880, 0.07, 'sine', 0.1)
  }

  function urgent() {
    tone(1320, 0.1, 'square', 0.14)
  }

  function startRound() {
    tone(523, 0.12)
    setTimeout(() => tone(659, 0.15), 90)
  }

  function success() {
    tone(523, 0.1)
    setTimeout(() => tone(659, 0.1), 80)
    setTimeout(() => tone(784, 0.18), 160)
  }

  function fail() {
    tone(220, 0.25, 'sawtooth', 0.1)
    setTimeout(() => tone(180, 0.35, 'sawtooth', 0.08), 120)
  }

  function timeUp() {
    tone(400, 0.15, 'triangle')
    setTimeout(() => tone(300, 0.2, 'triangle'), 100)
    setTimeout(() => tone(200, 0.35, 'sawtooth', 0.1), 220)
  }

  function passPhone() {
    tone(440, 0.08)
    setTimeout(() => tone(550, 0.1), 70)
  }

  function watchCountdown(timeLeft: Ref<number>, urgentAt = 3) {
    watch(timeLeft, (current, previous) => {
      if (previous === undefined || current >= previous) return
      if (current <= 0) {
        timeUp()
      } else if (current <= urgentAt) {
        urgent()
      } else {
        tick()
      }
    })
  }

  return {
    enabled,
    tick,
    urgent,
    startRound,
    success,
    fail,
    timeUp,
    passPhone,
    watchCountdown,
  }
}
