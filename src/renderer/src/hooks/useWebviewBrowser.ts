import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings, BrowserBounds } from '../../../preload/types'
import { normalizeUrl } from '../url'

interface UseWebviewBrowserOptions {
  active: boolean
  initialUrl: string
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onStatusChange: (status: string) => void
}

export interface WebviewBrowserState {
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
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  }
}

export function useWebviewBrowser({
  active,
  initialUrl,
  settings,
  onSettingsChange,
  onStatusChange
}: UseWebviewBrowserOptions): WebviewBrowserState {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(false)
  const [urlInput, setUrlInput] = useState(settings.lastUrl)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const syncBounds = useCallback((): void => {
    const viewport = viewportRef.current
    if (!viewport || !mountedRef.current) return
    window.stealth.browserSetBounds(readViewportBounds(viewport))
  }, [])

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
    if (!active) {
      mountedRef.current = false
      void window.stealth.browserUnmount()
      return
    }

    let cancelled = false

    const mountBrowser = async (): Promise<void> => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const viewport = viewportRef.current
      if (cancelled || !viewport) return

      const bounds = readViewportBounds(viewport)
      if (bounds.width <= 0 || bounds.height <= 0) return

      await window.stealth.browserMount({
        url: initialUrl,
        bounds,
        transparent: settings.transparentMode ?? true,
        opacity: settings.contentOpacity
      })

      if (cancelled) {
        void window.stealth.browserUnmount()
        return
      }

      mountedRef.current = true
      syncBounds()
    }

    void mountBrowser()

    const viewport = viewportRef.current
    const resizeObserver =
      viewport && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncBounds())
        : null

    resizeObserver?.observe(viewport!)
    window.addEventListener('resize', syncBounds)

    return () => {
      cancelled = true
      mountedRef.current = false
      resizeObserver?.disconnect()
      window.removeEventListener('resize', syncBounds)
      void window.stealth.browserUnmount()
    }
  }, [active, initialUrl, settings.contentOpacity, settings.transparentMode, syncBounds])

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
          void onSettingsChange({ lastUrl: event.url })
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
        default:
          break
      }
    })
  }, [active, applyTransparency, onSettingsChange, onStatusChange])

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
