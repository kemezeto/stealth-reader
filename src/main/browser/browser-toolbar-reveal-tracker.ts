import { BrowserWindow, screen } from 'electron'

const POLL_INTERVAL_MS = 50
const REVEAL_ZONE_PX = 24

export const BROWSER_TOOLBAR_REVEAL_CHANNEL = 'browser-toolbar-reveal'

export interface BrowserToolbarTrackerState {
  browsing: boolean
  autoHide: boolean
  hidden: boolean
}

export class BrowserToolbarRevealTracker {
  private timer: NodeJS.Timeout | null = null
  private state: BrowserToolbarTrackerState = {
    browsing: false,
    autoHide: false,
    hidden: false
  }

  constructor(private getWindow: () => BrowserWindow | null) {}

  setState(partial: Partial<BrowserToolbarTrackerState>): void {
    this.state = { ...this.state, ...partial }
    this.syncPolling()
  }

  dispose(): void {
    this.stopPolling()
  }

  private shouldPoll(): boolean {
    return this.state.browsing && this.state.autoHide && this.state.hidden
  }

  private syncPolling(): void {
    if (this.shouldPoll()) {
      this.startPolling()
      return
    }
    this.stopPolling()
  }

  private startPolling(): void {
    if (this.timer) return
    this.poll()
    this.timer = setInterval(() => this.poll(), POLL_INTERVAL_MS)
    this.timer.unref?.()
  }

  private stopPolling(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private poll(): void {
    const window = this.getWindow()
    if (!window || window.isDestroyed() || !window.isVisible() || window.isMinimized()) {
      return
    }

    const cursor = screen.getCursorScreenPoint()
    const bounds = window.getBounds()

    if (
      cursor.x >= bounds.x &&
      cursor.x < bounds.x + bounds.width &&
      cursor.y >= bounds.y + bounds.height - REVEAL_ZONE_PX &&
      cursor.y <= bounds.y + bounds.height
    ) {
      if (window.webContents.isDestroyed()) return
      window.webContents.send(BROWSER_TOOLBAR_REVEAL_CHANNEL)
    }
  }
}

export function createBrowserToolbarRevealTracker(
  getWindow: () => BrowserWindow | null
): BrowserToolbarRevealTracker {
  return new BrowserToolbarRevealTracker(getWindow)
}
