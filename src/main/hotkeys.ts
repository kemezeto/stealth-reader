import { BrowserWindow, globalShortcut } from 'electron'
import { normalizeAccelerator } from '../shared/hotkeys'

export interface GlobalHotkeySettings {
  bossKey1: string
  bossKey2: string
  bossKeyEnabled: boolean
  browserTabPrev: string
  browserTabNext: string
  browserTabSwitchEnabled: boolean
  lockEnabled?: boolean
  lockShortcut?: string
}

type HotkeyHandlers = {
  onBossKey1: () => void
  onBossKey2: () => void
  onBrowserTabPrev: () => void
  onBrowserTabNext: () => void
  onLock?: () => void
}

const registered = new Map<string, () => void>()

function unregisterAllTracked(): void {
  for (const accelerator of Array.from(registered.keys())) {
    try {
      globalShortcut.unregister(accelerator)
    } catch {
      // ignore
    }
  }
  registered.clear()
}

function registerOne(accelerator: string, handler: () => void): boolean {
  const normalized = normalizeAccelerator(accelerator.trim())
  if (!normalized) return false

  if (registered.has(normalized)) {
    return true
  }

  try {
    const ok = globalShortcut.register(normalized, handler)
    if (ok) {
      registered.set(normalized, handler)
    }
    return ok
  } catch (error) {
    console.warn('[hotkeys] Failed to register shortcut:', normalized, error)
    return false
  }
}

export function canRegisterGlobalShortcut(accelerator: string): boolean {
  const normalized = normalizeAccelerator(accelerator.trim())
  if (!normalized) return false
  if (registered.has(normalized)) return true

  try {
    const ok = globalShortcut.register(normalized, () => {})
    if (ok) {
      globalShortcut.unregister(normalized)
    }
    return ok
  } catch {
    return false
  }
}

export function syncGlobalHotkeys(settings: GlobalHotkeySettings, handlers: HotkeyHandlers): void {
  unregisterAllTracked()

  if (settings.bossKeyEnabled) {
    registerOne(settings.bossKey1, handlers.onBossKey1)
    registerOne(settings.bossKey2, handlers.onBossKey2)
  }

  if (settings.browserTabSwitchEnabled) {
    registerOne(settings.browserTabPrev, handlers.onBrowserTabPrev)
    registerOne(settings.browserTabNext, handlers.onBrowserTabNext)
  }

  if (settings.lockEnabled && settings.lockShortcut && handlers.onLock) {
    registerOne(settings.lockShortcut, handlers.onLock)
  }
}

export function disposeGlobalHotkeys(): void {
  unregisterAllTracked()
}

export function sendBrowserTabSwitch(window: BrowserWindow | null, direction: 'prev' | 'next'): void {
  window?.webContents.send('browser-tab-switch', direction)
}
