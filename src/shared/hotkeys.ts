const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

const DISPLAY_KEY_ALIASES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  PageUp: 'PgUp',
  PageDown: 'PgDn'
}

function normalizeKeyToken(key: string, code: string): string | null {
  if (MODIFIER_KEYS.has(key)) return null

  if (key === ' ') return 'Space'
  if (key.length === 1) return key.toUpperCase()

  if (key.startsWith('Arrow') || key === 'PageUp' || key === 'PageDown' || key === 'Enter' || key === 'Escape') {
    return key
  }

  if (code.startsWith('Key') && code.length === 4) {
    return code.slice(3).toUpperCase()
  }

  if (code.startsWith('Digit') && code.length === 6) {
    return code.slice(5)
  }

  return key
}

function formatHotkeyPart(part: string): string {
  if (part === 'CommandOrControl') return 'Ctrl'
  if (part === 'Command') return 'Cmd'
  if (part === 'Control') return 'Ctrl'
  if (DISPLAY_KEY_ALIASES[part]) return DISPLAY_KEY_ALIASES[part]
  if (part.length === 1) return part.toUpperCase()
  return part
}

export function formatHotkeyDisplay(accelerator: string): string {
  if (!accelerator) return '—'
  return splitHotkeyParts(accelerator).join('+')
}

export function splitHotkeyParts(accelerator: string): string[] {
  if (!accelerator.trim()) return []

  return accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(formatHotkeyPart)
}

export function eventToDisplayParts(event: KeyboardEvent): string[] {
  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  const keyToken = normalizeKeyToken(event.key, event.code)
  if (keyToken) parts.push(keyToken)

  return parts.map(formatHotkeyPart)
}

export function eventToAccelerator(event: KeyboardEvent): string | null {
  const keyToken = normalizeKeyToken(event.key, event.code)
  if (!keyToken) return null

  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  parts.push(keyToken)

  return parts.join('+')
}

export function matchesHotkey(event: KeyboardEvent, accelerator: string): boolean {
  if (!accelerator) return false

  const captured = eventToAccelerator(event)
  if (!captured) return false

  return normalizeAccelerator(captured) === normalizeAccelerator(accelerator)
}

export function normalizeAccelerator(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => {
      if (part === 'Cmd' || part === 'Ctrl') return 'CommandOrControl'
      if (part === 'Control') return 'CommandOrControl'
      if (part.length === 1) return part.toUpperCase()
      return part
    })
    .join('+')
}

export function isReaderHotkey(accelerator: string): boolean {
  return Boolean(accelerator.trim())
}

export function isGlobalHotkey(accelerator: string): boolean {
  const normalized = normalizeAccelerator(accelerator)
  const parts = normalized.split('+')
  const key = parts[parts.length - 1]
  const hasModifier = parts.some((part) =>
    ['CommandOrControl', 'Alt', 'Shift', 'Command', 'Control'].includes(part)
  )

  return Boolean(key) && (hasModifier || parts.length === 1)
}
