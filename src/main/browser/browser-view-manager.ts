import { BrowserView, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { BROWSER_SESSION_PARTITION } from './browser-cache'
import { applyMobileWebProfile } from './mobile-profile'

const HIDE_SCROLLBAR_CSS = `
  html, body {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
`

const BROWSER_EVENT_CHANNEL = 'browser-event'
const BROWSER_ZOOM_CHANGED_CHANNEL = 'browser-zoom-changed'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_WHEEL_STEP = 0.05

export interface BrowserBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface BrowserMountOptions {
  url: string
  bounds: BrowserBounds
  transparent: boolean
  opacity: number
  showScrollbar: boolean
  zoomFactor: number
}

export type BrowserEventPayload =
  | { type: 'loading'; loading: boolean }
  | { type: 'navigate'; url: string; canGoBack: boolean; canGoForward: boolean }
  | { type: 'fail-load'; errorDescription: string }
  | { type: 'ready' }
  | { type: 'sync-bounds' }

function normalizeBounds(bounds: BrowserBounds): Electron.Rectangle {
  return {
    x: Math.max(0, Math.round(bounds.x)),
    y: Math.max(0, Math.round(bounds.y)),
    width: Math.max(0, Math.round(bounds.width)),
    height: Math.max(0, Math.round(bounds.height))
  }
}

export class BrowserViewManager {
  private view: BrowserView | null = null
  private transparent = true
  private opacity = 100
  private savedBounds: Electron.Rectangle | null = null
  private autoHideSuppressed = false
  private showScrollbar = true
  private scrollbarCssKey: string | null = null
  private zoomFactor = 1

  constructor(private getWindow: () => BrowserWindow | null) {}

  registerIpc(): void {
    ipcMain.handle('browser-mount', (_event, options: BrowserMountOptions) => {
      this.mount(options)
    })

    ipcMain.handle('browser-unmount', () => {
      this.unmount()
    })

    ipcMain.on('browser-set-bounds', (_event, bounds: BrowserBounds) => {
      this.setBounds(bounds)
    })

    ipcMain.handle('browser-navigate', (_event, url: string) => {
      this.loadURL(url)
    })

    ipcMain.handle('browser-back', () => this.goBack())

    ipcMain.handle('browser-forward', () => this.goForward())

    ipcMain.handle('browser-reload', () => {
      this.reload()
    })

    ipcMain.on('browser-set-transparency', (_event, payload: { transparent: boolean; opacity: number }) => {
      this.transparent = payload.transparent
      this.opacity = payload.opacity
      this.applyTransparency()
    })

    ipcMain.on('browser-set-scrollbar', (_event, show: boolean) => {
      this.showScrollbar = show
      void this.applyScrollbarVisibility()
    })

    ipcMain.on('browser-set-zoom', (_event, factor: number) => {
      this.zoomFactor = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor))
      this.applyZoom()
    })
  }

  mount(options: BrowserMountOptions): void {
    const window = this.getWindow()
    if (!window) return

    this.unmount()

    this.transparent = options.transparent
    this.opacity = options.opacity
    this.showScrollbar = options.showScrollbar
    this.scrollbarCssKey = null
    this.zoomFactor = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, options.zoomFactor))

    const view = new BrowserView({
      webPreferences: {
        preload: join(__dirname, '../preload/browser-transparency.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        partition: BROWSER_SESSION_PARTITION,
        backgroundThrottling: false
      }
    })

    const { webContents } = view
    applyMobileWebProfile(webContents)

    webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        void webContents.loadURL(url)
      }
      return { action: 'deny' }
    })

    this.attachWebContentsEvents(window, webContents)
    this.attachWheelZoom(window, webContents)

    window.addBrowserView(view)
    view.setBounds(normalizeBounds(options.bounds))
    this.view = view

    void webContents.loadURL(options.url)
  }

  unmount(): void {
    const window = this.getWindow()
    const view = this.view
    if (!view) return

    if (window && !window.isDestroyed()) {
      window.removeBrowserView(view)
    }

    if (!view.webContents.isDestroyed()) {
      view.webContents.close()
    }

    this.view = null
    this.autoHideSuppressed = false
    this.savedBounds = null
    this.scrollbarCssKey = null
  }

  setBounds(bounds: BrowserBounds): void {
    const view = this.view
    const window = this.getWindow()
    if (!view || !window || window.isDestroyed()) return

    const normalized = normalizeBounds(bounds)
    if (normalized.width <= 0 || normalized.height <= 0) return

    if (this.autoHideSuppressed) {
      this.savedBounds = normalized
      return
    }

    view.setBounds(normalized)
  }

  setAutoHideSuppressed(suppressed: boolean): void {
    const view = this.view
    const window = this.getWindow()
    if (!view || !window || window.isDestroyed()) return

    if (suppressed && !this.autoHideSuppressed) {
      this.autoHideSuppressed = true
      this.savedBounds = view.getBounds()
      window.removeBrowserView(view)
      return
    }

    if (!suppressed && this.autoHideSuppressed) {
      this.autoHideSuppressed = false
      this.savedBounds = null

      window.addBrowserView(view)
      this.sendEvent(window, { type: 'sync-bounds' })
    }
  }

  loadURL(url: string): void {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed()) return
    void webContents.loadURL(url)
  }

  goBack(): boolean {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed() || !webContents.canGoBack()) return false
    webContents.goBack()
    return true
  }

  goForward(): boolean {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed() || !webContents.canGoForward()) return false
    webContents.goForward()
    return true
  }

  reload(): void {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed()) return
    webContents.reload()
  }

  dispose(): void {
    this.unmount()
  }

  private applyTransparency(): void {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed()) return

    webContents.send('content-transparency', this.transparent)
    webContents.send('content-opacity', this.opacity)
  }

  private applyZoom(): void {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed()) return
    webContents.setZoomFactor(this.zoomFactor)
  }

  private notifyZoomChanged(window: BrowserWindow): void {
    if (window.isDestroyed() || window.webContents.isDestroyed()) return
    window.webContents.send(BROWSER_ZOOM_CHANGED_CHANNEL, Math.round(this.zoomFactor * 100))
  }

  private attachWheelZoom(window: BrowserWindow, webContents: Electron.WebContents): void {
    webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'mouseWheel') return
      if (!input.control && !input.meta) return

      event.preventDefault()

      const delta = input.deltaY > 0 ? -ZOOM_WHEEL_STEP : ZOOM_WHEEL_STEP
      const next = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoomFactor + delta)) * 100) / 100
      if (next === this.zoomFactor) return

      this.zoomFactor = next
      this.applyZoom()
      this.notifyZoomChanged(window)
    })
  }

  private async applyScrollbarVisibility(): Promise<void> {
    const webContents = this.view?.webContents
    if (!webContents || webContents.isDestroyed()) return

    if (this.scrollbarCssKey) {
      try {
        await webContents.removeInsertedCSS(this.scrollbarCssKey)
      } catch {
        // ignore stale css keys after navigation
      }
      this.scrollbarCssKey = null
    }

    if (this.showScrollbar) return

    try {
      this.scrollbarCssKey = await webContents.insertCSS(HIDE_SCROLLBAR_CSS)
    } catch {
      // ignore pages that reject css injection
    }
  }

  private sendEvent(window: BrowserWindow, payload: BrowserEventPayload): void {
    if (window.isDestroyed() || window.webContents.isDestroyed()) return
    window.webContents.send(BROWSER_EVENT_CHANNEL, payload)
  }

  private attachWebContentsEvents(window: BrowserWindow, webContents: Electron.WebContents): void {
    const emitNavigate = (url: string): void => {
      if (!url || url === 'about:blank') return
      this.sendEvent(window, {
        type: 'navigate',
        url,
        canGoBack: webContents.canGoBack(),
        canGoForward: webContents.canGoForward()
      })
    }

    webContents.on('did-start-loading', () => {
      this.sendEvent(window, { type: 'loading', loading: true })
    })

    webContents.on('did-stop-loading', () => {
      this.sendEvent(window, { type: 'loading', loading: false })
      emitNavigate(webContents.getURL())
    })

    webContents.on('did-navigate', (_event, url) => {
      emitNavigate(url)
      this.applyTransparency()
      void this.applyScrollbarVisibility()
    })

    webContents.on('did-navigate-in-page', (_event, url) => {
      emitNavigate(url)
      this.applyTransparency()
      void this.applyScrollbarVisibility()
    })

    webContents.on('did-finish-load', () => {
      this.applyZoom()
      this.applyTransparency()
      void this.applyScrollbarVisibility()
      this.sendEvent(window, { type: 'ready' })
    })

    webContents.on('did-fail-load', (_event, _code, errorDescription, validatedURL) => {
      if (validatedURL === 'about:blank') return
      this.sendEvent(window, { type: 'fail-load', errorDescription })
      this.sendEvent(window, { type: 'loading', loading: false })
    })
  }
}

export { BROWSER_EVENT_CHANNEL }
