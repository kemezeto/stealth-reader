import { BrowserWindow, screen } from 'electron'

const POLL_INTERVAL_MS = 50
const HIDE_CONFIRM_POLLS = 4
const REVEAL_CONFIRM_POLLS = 3
const UI_TRANSITION_MS = 150
const HIDE_OUTSET_PX = 10
const REVEAL_INSET_PX = 6

const AUTO_HIDE_STATE_CHANNEL = 'auto-hide:state'

export interface AutoHideStatePayload {
  hidden: boolean
}

function isInsideRevealZone(bounds: Electron.Rectangle, point: Electron.Point): boolean {
  const minWidth = REVEAL_INSET_PX * 2 + 20
  const minHeight = REVEAL_INSET_PX * 2 + 20
  if (bounds.width < minWidth || bounds.height < minHeight) {
    return (
      point.x >= bounds.x &&
      point.x < bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y < bounds.y + bounds.height
    )
  }

  return (
    point.x >= bounds.x + REVEAL_INSET_PX &&
    point.x < bounds.x + bounds.width - REVEAL_INSET_PX &&
    point.y >= bounds.y + REVEAL_INSET_PX &&
    point.y < bounds.y + bounds.height - REVEAL_INSET_PX
  )
}

function isOutsideHideZone(bounds: Electron.Rectangle, point: Electron.Point): boolean {
  return (
    point.x < bounds.x - HIDE_OUTSET_PX ||
    point.x >= bounds.x + bounds.width + HIDE_OUTSET_PX ||
    point.y < bounds.y - HIDE_OUTSET_PX ||
    point.y >= bounds.y + bounds.height + HIDE_OUTSET_PX
  )
}

export class AutoHideTracker {
  private timer: NodeJS.Timeout | null = null
  private ignoreTimer: NodeJS.Timeout | null = null
  private bossKeyHidden = false
  private uiHidden = false
  private outsideStreak = 0
  private insideStreak = 0

  constructor(
    private getWindow: () => BrowserWindow | null,
    private isEnabled: () => boolean
  ) {}

  isUserVisible(): boolean {
    const window = this.getWindow()
    if (!window || window.isDestroyed() || !window.isVisible()) {
      return false
    }
    return !this.uiHidden && !this.bossKeyHidden
  }

  isUiHidden(): boolean {
    return this.uiHidden
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.start()
      return
    }

    this.restoreUi({ notifyRenderer: true })
    this.stop()
  }

  notifyBossKeyHide(): void {
    this.restoreUi({ notifyRenderer: true })
    this.bossKeyHidden = true
    this.clearIgnoreTimer()
  }

  notifyBossKeyShow(): void {
    this.bossKeyHidden = false
    this.outsideStreak = 0
    this.insideStreak = 0
    this.clearIgnoreTimer()

    const window = this.getWindow()
    if (window && !window.isDestroyed()) {
      window.setIgnoreMouseEvents(false)
    }
  }

  dispose(): void {
    this.restoreUi({ notifyRenderer: true })
    this.stop()
  }

  private start(): void {
    if (this.timer) {
      this.poll()
      return
    }
    this.poll()
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS)
    this.timer.unref?.()
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.clearIgnoreTimer()
    this.outsideStreak = 0
    this.insideStreak = 0
  }

  private clearIgnoreTimer(): void {
    if (!this.ignoreTimer) return
    clearTimeout(this.ignoreTimer)
    this.ignoreTimer = null
  }

  private sendUiState(window: BrowserWindow, hidden: boolean): void {
    if (window.webContents.isDestroyed()) return
    window.webContents.send(AUTO_HIDE_STATE_CHANNEL, { hidden } satisfies AutoHideStatePayload)
  }

  private hideUi(window: BrowserWindow): void {
    if (this.uiHidden || this.bossKeyHidden) return

    this.uiHidden = true
    this.insideStreak = 0
    this.clearIgnoreTimer()
    this.sendUiState(window, true)

    this.ignoreTimer = setTimeout(() => {
      this.ignoreTimer = null
      if (!this.uiHidden || window.isDestroyed()) return
      window.setIgnoreMouseEvents(true, { forward: true })
    }, UI_TRANSITION_MS)
  }

  private revealUi(window: BrowserWindow): void {
    if (!this.uiHidden) return

    this.uiHidden = false
    this.outsideStreak = 0
    this.clearIgnoreTimer()
    window.setIgnoreMouseEvents(false)

    // 等一帧再显示 UI，避免 Windows 上 mouse events 与重绘抢帧导致闪烁
    setImmediate(() => {
      if (window.isDestroyed() || this.uiHidden) return
      this.sendUiState(window, false)
    })
  }

  private restoreUi(options: { notifyRenderer: boolean }): void {
    this.clearIgnoreTimer()
    this.uiHidden = false
    this.outsideStreak = 0
    this.insideStreak = 0

    const window = this.getWindow()
    if (!window || window.isDestroyed()) return

    window.setIgnoreMouseEvents(false)
    if (options.notifyRenderer) {
      this.sendUiState(window, false)
    }
  }

  private poll(): void {
    const window = this.getWindow()
    if (!window || window.isDestroyed() || !this.isEnabled()) {
      return
    }

    if (window.isMinimized() || window.isFullScreen() || !window.isVisible()) {
      if (this.bossKeyHidden && window.isVisible()) {
        return
      }
      return
    }

    const cursor = screen.getCursorScreenPoint()
    const bounds = window.getBounds()

    if (this.uiHidden) {
      if (isInsideRevealZone(bounds, cursor)) {
        this.insideStreak += 1
        if (this.insideStreak >= REVEAL_CONFIRM_POLLS) {
          this.revealUi(window)
        }
      } else {
        this.insideStreak = 0
      }
      return
    }

    if (!isOutsideHideZone(bounds, cursor)) {
      this.outsideStreak = 0
      return
    }

    this.outsideStreak += 1
    if (this.outsideStreak >= HIDE_CONFIRM_POLLS) {
      this.hideUi(window)
    }
  }
}

export function createAutoHideTracker(
  getWindow: () => BrowserWindow | null,
  isEnabled: () => boolean
): AutoHideTracker {
  return new AutoHideTracker(getWindow, isEnabled)
}

export { AUTO_HIDE_STATE_CHANNEL }
