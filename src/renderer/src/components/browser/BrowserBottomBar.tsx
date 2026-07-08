import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../../../preload/types'
import BrowserBookmarkSheet from './BrowserBookmarkSheet'
import BrowserBottomToolbar from './BrowserBottomToolbar'
import BrowserHistorySheet from './BrowserHistorySheet'
import BrowserZoomSheet from './BrowserZoomSheet'
import type { BrowserBottomToolbarContext } from './browser-bottom-toolbar'

interface BrowserBottomBarProps {
  settings: AppSettings
  currentUrl: string
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

const HIDE_DELAY_MS = 120

export default function BrowserBottomBar({
  settings,
  currentUrl,
  onSettingsChange
}: BrowserBottomBarProps): JSX.Element {
  const [iconsHidden, setIconsHidden] = useState(false)
  const [zoomSheetOpen, setZoomSheetOpen] = useState(false)
  const [bookmarkSheetOpen, setBookmarkSheetOpen] = useState(false)
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const autoHide = settings.browserToolbarAutoHide ?? false

  const syncTrackerState = useCallback(
    (nextHidden: boolean): void => {
      window.stealth.browserToolbarSetState({
        browsing: true,
        autoHide,
        hidden: nextHidden
      })
    },
    [autoHide]
  )

  const revealIcons = useCallback((): void => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setIconsHidden(false)
    syncTrackerState(false)
  }, [syncTrackerState])

  const scheduleHideIcons = useCallback((): void => {
    if (!autoHide) return

    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
    }

    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      setIconsHidden(true)
      syncTrackerState(true)
    }, HIDE_DELAY_MS)
  }, [autoHide, syncTrackerState])

  const closeOtherSheets = useCallback((except: 'zoom' | 'bookmark' | 'history' | null) => {
    if (except !== 'zoom') setZoomSheetOpen(false)
    if (except !== 'bookmark') setBookmarkSheetOpen(false)
    if (except !== 'history') setHistorySheetOpen(false)
  }, [])

  const toggleZoomSheet = useCallback((): void => {
    setZoomSheetOpen((open) => {
      const next = !open
      if (next) closeOtherSheets('zoom')
      return next
    })
  }, [closeOtherSheets])

  const toggleBookmarkSheet = useCallback((): void => {
    setBookmarkSheetOpen((open) => {
      const next = !open
      if (next) closeOtherSheets('bookmark')
      return next
    })
  }, [closeOtherSheets])

  const toggleHistorySheet = useCallback((): void => {
    setHistorySheetOpen((open) => {
      const next = !open
      if (next) closeOtherSheets('history')
      return next
    })
  }, [closeOtherSheets])

  useEffect(() => {
    if (!autoHide) {
      revealIcons()
    }
  }, [autoHide, revealIcons])

  useEffect(() => {
    syncTrackerState(iconsHidden)
    return () => {
      window.stealth.browserToolbarSetState({
        browsing: false,
        autoHide: false,
        hidden: false
      })
    }
  }, [iconsHidden, syncTrackerState])

  useEffect(() => {
    return window.stealth.onBrowserToolbarReveal(revealIcons)
  }, [revealIcons])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  const toolbarContext: BrowserBottomToolbarContext = {
    settings,
    onSettingsChange,
    currentUrl,
    toggleZoomSheet,
    zoomSheetOpen,
    toggleBookmarkSheet,
    bookmarkSheetOpen,
    toggleHistorySheet,
    historySheetOpen
  }

  return (
    <div className="browser-bottom-shell">
      <BrowserZoomSheet
        open={zoomSheetOpen}
        settings={settings}
        currentUrl={currentUrl}
        onSettingsChange={onSettingsChange}
        onClose={() => setZoomSheetOpen(false)}
      />

      <BrowserBookmarkSheet
        open={bookmarkSheetOpen}
        settings={settings}
        currentUrl={currentUrl}
        onSettingsChange={onSettingsChange}
        onClose={() => setBookmarkSheetOpen(false)}
      />

      <BrowserHistorySheet
        open={historySheetOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setHistorySheetOpen(false)}
      />

      <div
        className="browser-bottom-bar"
        onMouseEnter={revealIcons}
        onMouseLeave={scheduleHideIcons}
      >
        <BrowserBottomToolbar
          context={toolbarContext}
          iconsHidden={autoHide && iconsHidden}
        />
      </div>
    </div>
  )
}
