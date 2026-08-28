const KEY_FROM_CODE: Record<string, string> = {
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  Space: ' ',
  KeyX: 'x',
}

export function dispatchGameKey(type: 'keydown' | 'keyup', code: string) {
  if (!import.meta.client) return

  const event = new KeyboardEvent(type, {
    code,
    key: KEY_FROM_CODE[code] ?? code,
    bubbles: true,
    cancelable: true,
  })

  document.dispatchEvent(event)
}

export function pressGameKey(code: string) {
  dispatchGameKey('keydown', code)
}

export function releaseGameKey(code: string) {
  dispatchGameKey('keyup', code)
}

export function tapGameKey(code: string) {
  pressGameKey(code)
  requestAnimationFrame(() => {
    releaseGameKey(code)
  })
}
