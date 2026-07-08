import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings, BrowserBounds } from '../../../preload/types'
import { persistBrowserZoomChange, resolveBrowserZoomPercent } from '../components/browser/browser-zoom'
import { addBrowserHistoryEntry } from '../components/browser/browser-history'
import { normalizeUrl } from '../url'

interface UseEmbeddedBrowserOptions {
  active: boolean
  initialUrl: string
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onStatusChange: (status: string) => void
}

export interface EmbeddedBrowserState {
  viewportRef: React.RefObject<HTMLDivElement | null>
  urlInput: string
  setUrlInput: React.Dispatch<React.SetStateAction<string>>
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  loadError: string | null
  goBack: () => void
  goForward: () => void
  reload: () => void
  loadUrl: (rawUrl: string) => string | null
  clearError: () => void
  toggleTransparentMode: () => void
}

function readViewportBounds(element: HTMLDivElement): BrowserBounds {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height
  }
}

function boundsAreValid(bounds: BrowserBounds): boolean {
  return bounds.width > 0 && bounds.height > 0
}

export function useEmbeddedBrowser({
  active,
  initialUrl,
  settings,
  onSettingsChange,
  onStatusChange
}: UseEmbeddedBrowserOptions): EmbeddedBrowserState {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(false)
  const syncFrameRef = useRef<number | null>(null)
  const settingsRef = useRef(settings)
  const urlRef = useRef(settings.lastUrl)
  const [urlInput, setUrlInput] = useState(settings.lastUrl)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  settingsRef.current = settings
  urlRef.current = urlInput

  const applyZoomForCurrentUrl = useCallback((): void => {
    const percent = resolveBrowserZoomPercent(settingsRef.current, urlRef.current)
    window.stealth.browserSetZoom(percent / 100)
  }, [])

  const syncBounds = useCallback((): void => {
    const viewport = viewportRef.current
    if (!viewport || !mountedRef.current) return

    const bounds = readViewportBounds(viewport)
    if (!boundsAreValid(bounds)) return

    window.stealth.browserSetBounds(bounds)
  }, [])

  const scheduleSyncBounds = useCallback((): void => {
    if (syncFrameRef.current !== null) return

    syncFrameRef.current = requestAnimationFrame(() => {
      syncFrameRef.current = null
      syncBounds()
    })
  }, [syncBounds])

  const applyTransparency = useCallback((): void => {
    window.stealth.browserSetTransparency(settings.transparentMode ?? true, settings.contentOpacity)
  }, [settings.contentOpacity, settings.transparentMode])

  const loadUrl = useCallback(
    (rawUrl: string): string | null => {
      const nextUrl = normalizeUrl(rawUrl, settings.searchEngine)
      if (!nextUrl) return null

      setUrlInput(rawUrl.trim() || nextUrl)
      setLoadError(null)
      setIsLoading(true)
      onStatusChange('加载中')
      void window.stealth.browserNavigate(nextUrl)
      void onSettingsChange({ lastUrl: nextUrl })
      return nextUrl
    },
    [onSettingsChange, onStatusChange, settings.searchEngine]
  )

  const goBack = useCallback((): void => {
    void window.stealth.browserBack()
  }, [])

  const goForward = useCallback((): void => {
    void window.stealth.browserForward()
  }, [])

  const reload = useCallback((): void => {
    setLoadError(null)
    setIsLoading(true)
    onStatusChange('加载中')
    void window.stealth.browserReload()
  }, [onStatusChange])

  const clearError = useCallback((): void => {
    setLoadError(null)
  }, [])

  const toggleTransparentMode = useCallback((): void => {
    const next = !settings.transparentMode
    onSettingsChange({ transparentMode: next })
    window.stealth.browserSetTransparency(next, settings.contentOpacity)
  }, [onSettingsChange, settings.contentOpacity, settings.transparentMode])

  useEffect(() => {
    if (active) {
      setUrlInput(initialUrl)
      setLoadError(null)
      setIsLoading(true)
    }
  }, [active, initialUrl])

  useEffect(() => {
    if (!active) return
    scheduleSyncBounds()
  }, [active, loadError, scheduleSyncBounds])

  useEffect(() => {
    if (!active) {
      mountedRef.current = false
      void window.stealth.browserUnmount()
      return
    }

    let cancelled = false

    const mountBrowser = async (): Promise<void> => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

        const viewport = viewportRef.current
        if (cancelled || !viewport) return

        const bounds = readViewportBounds(viewport)
        if (!boundsAreValid(bounds)) continue

        await window.stealth.browserMount({
          url: initialUrl,
          bounds,
          transparent: settings.transparentMode ?? true,
          opacity: settings.contentOpacity,
          showScrollbar: settings.browserShowScrollbar ?? true,
          zoomFactor: resolveBrowserZoomPercent(settings, initialUrl) / 100
        })

        if (cancelled) {
          void window.stealth.browserUnmount()
          return
        }

        mountedRef.current = true
        scheduleSyncBounds()
        return
      }
    }

    void mountBrowser()

    const viewport = viewportRef.current
    const page = viewport?.closest('.page--browser')
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleSyncBounds())
        : null

    resizeObserver?.observe(viewport!)
    if (page instanceof HTMLElement) {
      resizeObserver?.observe(page)
    }

    window.addEventListener('resize', scheduleSyncBounds)

    const unsubscribeWindowResize = window.stealth.onWindowResized(scheduleSyncBounds)
    const unsubscribeAutoHide = window.stealth.onAutoHideStateChanged(({ hidden }) => {
      if (!hidden) scheduleSyncBounds()
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current)
        syncFrameRef.current = null
      }
      resizeObserver?.disconnect()
      window.removeEventListener('resize', scheduleSyncBounds)
      unsubscribeWindowResize()
      unsubscribeAutoHide()
      void window.stealth.browserUnmount()
    }
  }, [active, initialUrl, scheduleSyncBounds, settings.contentOpacity, settings.transparentMode])

  useEffect(() => {
    if (!active) return
    window.stealth.browserSetScrollbar(settings.browserShowScrollbar ?? true)
  }, [active, settings.browserShowScrollbar])

  useEffect(() => {
    if (!active) return
    applyZoomForCurrentUrl()
  }, [
    active,
    applyZoomForCurrentUrl,
    settings.browserZoomByDomain,
    settings.browserZoomPercent,
    settings.browserZoomScope,
    urlInput
  ])

  useEffect(() => {
    if (!active) return

    return window.stealth.onBrowserZoomChanged((percent) => {
      onSettingsChange(persistBrowserZoomChange(settingsRef.current, urlRef.current, percent))
    })
  }, [active, onSettingsChange])

  useEffect(() => {
    return window.stealth.onBrowserTabSwitch((direction) => {
      if (!active) return
      if (direction === 'prev') goBack()
      if (direction === 'next') goForward()
    })
  }, [active, goBack, goForward])

  useEffect(() => {
    return window.stealth.onContentOpacityChanged((opacity) => {
      window.stealth.browserSetTransparency(settings.transparentMode ?? true, opacity)
    })
  }, [settings.transparentMode])

  useEffect(() => {
    if (!active) return

    return window.stealth.onBrowserEvent((event) => {
      switch (event.type) {
        case 'loading':
          setIsLoading(event.loading)
          onStatusChange(event.loading ? '加载中' : '浏览中')
          break
        case 'navigate':
          setUrlInput(event.url)
          setCanGoBack(event.canGoBack)
          setCanGoForward(event.canGoForward)
          setLoadError(null)
          void onSettingsChange({
            lastUrl: event.url,
            browserHistory: addBrowserHistoryEntry(
              settingsRef.current.browserHistory ?? [],
              event.url
            )
          })
          break
        case 'fail-load':
          setIsLoading(false)
          setLoadError(event.errorDescription || '页面加载失败')
          onStatusChange('加载失败')
          break
        case 'ready':
          applyTransparency()
          onStatusChange('浏览中')
          break
        case 'sync-bounds':
          scheduleSyncBounds()
          break
        default:
          break
      }
    })
  }, [active, applyTransparency, onSettingsChange, onStatusChange, scheduleSyncBounds])

  useEffect(() => {
    if (active) applyTransparency()
  }, [active, applyTransparency, settings.transparentMode, settings.contentOpacity])

  return {
    viewportRef,
    urlInput,
    setUrlInput,
    canGoBack,
    canGoForward,
    isLoading,
    loadError,
    goBack,
    goForward,
    reload,
    loadUrl,
    clearError,
    toggleTransparentMode
  }
}
