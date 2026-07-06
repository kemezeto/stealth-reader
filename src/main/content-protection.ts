import type { BrowserWindow } from 'electron'
import koffi from 'koffi'

const WDA_NONE = 0
/** Capture shows whatever is behind the window instead of a black block. */
const WDA_MONITOR = 1

let setWindowDisplayAffinity: ((hwnd: unknown, affinity: number) => number) | null = null

if (process.platform === 'win32') {
  try {
    const user32 = koffi.load('user32.dll')
    setWindowDisplayAffinity = user32.func('int __stdcall SetWindowDisplayAffinity(void *hWnd, uint32 dwAffinity)')
  } catch (error) {
    console.warn('[capture-protection] Failed to load SetWindowDisplayAffinity:', error)
  }
}

function hwndFromWindow(window: BrowserWindow): unknown {
  return koffi.decode(window.getNativeWindowHandle(), 'void *')
}

export function applyCaptureProtection(window: BrowserWindow | null, enabled: boolean): void {
  if (!window) return

  if (process.platform !== 'win32') {
    window.setContentProtection(enabled)
    return
  }

  if (setWindowDisplayAffinity) {
    const hwnd = hwndFromWindow(window)
    const affinity = enabled ? WDA_MONITOR : WDA_NONE
    const ok = setWindowDisplayAffinity(hwnd, affinity) !== 0
    if (ok) {
      // Electron's setContentProtection uses WDA_EXCLUDEFROMCAPTURE on Windows,
      // which often appears as a black rectangle for transparent windows.
      window.setContentProtection(false)
      return
    }
  }

  window.setContentProtection(enabled)
}
