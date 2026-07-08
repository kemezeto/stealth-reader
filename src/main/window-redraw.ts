import type { BrowserWindow } from 'electron'

const pendingRedraws = new WeakMap<BrowserWindow, NodeJS.Timeout>()

/** Windows 透明窗口在失焦/webview 聚焦时可能停止绘制，强制触发一次重绘 */
export function scheduleWindowRedraw(window: BrowserWindow, opacityPercent?: number): void {
  if (window.isDestroyed()) return

  const existing = pendingRedraws.get(window)
  if (existing) clearTimeout(existing)

  pendingRedraws.set(
    window,
    setTimeout(() => {
      pendingRedraws.delete(window)
      forceWindowRedraw(window, opacityPercent)
    }, 16)
  )
}

export function forceWindowRedraw(window: BrowserWindow, opacityPercent?: number): void {
  if (window.isDestroyed() || !window.isVisible()) return

  const bounds = window.getBounds()
  window.setBounds({ ...bounds, width: bounds.width + 1 })
  window.setBounds(bounds)

  if (typeof opacityPercent === 'number') {
    const value = Math.max(0.15, Math.min(1, opacityPercent / 100))
    window.setOpacity(value)
  }
}
