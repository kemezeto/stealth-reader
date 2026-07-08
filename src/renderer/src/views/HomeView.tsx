import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../../../preload/types'
import BrowserView from '../components/browser/BrowserView'
import PortalHome from '../components/browser/PortalHome'
import { useWebviewBrowser } from '../hooks/useWebviewBrowser'
import { normalizeUrl } from '../url'

interface HomeViewProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onStatusChange: (status: string) => void
  onImmersiveChange: (immersive: boolean) => void
  onBrowsingChange?: (browsing: boolean) => void
  onBrowsingUrlChange?: (url: string) => void
}

export default function HomeView({
  settings,
  onSettingsChange,
  onStatusChange,
  onImmersiveChange,
  onBrowsingChange,
  onBrowsingUrlChange
}: HomeViewProps): JSX.Element {
  const [browsing, setBrowsing] = useState(false)
  const [browsingUrl, setBrowsingUrl] = useState(settings.lastUrl)

  const browser = useWebviewBrowser({
    active: browsing,
    initialUrl: browsingUrl,
    settings,
    onSettingsChange,
    onStatusChange
  })

  const { loadUrl, urlInput: browserUrlInput } = browser

  const openUrl = useCallback(
    (rawUrl: string): void => {
      const nextUrl = normalizeUrl(rawUrl, settings.searchEngine)
      if (!nextUrl) return

      if (browsing) {
        loadUrl(rawUrl)
        return
      }

      setBrowsingUrl(nextUrl)
      setBrowsing(true)
      onStatusChange('加载中')
      void onSettingsChange({ lastUrl: nextUrl })
    },
    [browsing, loadUrl, onSettingsChange, onStatusChange, settings.searchEngine]
  )

  const exitBrowsing = useCallback((): void => {
    setBrowsing(false)
    onStatusChange('就绪')
  }, [onStatusChange])

  useEffect(() => {
    onImmersiveChange(browsing)
    onBrowsingChange?.(browsing)
    if (!browsing) {
      onBrowsingUrlChange?.('')
    }
  }, [browsing, onBrowsingChange, onBrowsingUrlChange, onImmersiveChange])

  useEffect(() => {
    if (!browsing) return
    onBrowsingUrlChange?.(browserUrlInput)
  }, [browserUrlInput, browsing, onBrowsingUrlChange])

  if (browsing) {
    return <BrowserView settings={settings} onSettingsChange={onSettingsChange} browser={browser} onExit={exitBrowsing} />
  }

  return (
    <PortalHome settings={settings} onOpenUrl={openUrl} onSettingsChange={onSettingsChange} />
  )
}
