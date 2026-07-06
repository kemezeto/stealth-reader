import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../../../preload/types'
import { normalizeUrl } from '../url'

const CATEGORIES = [
  {
    id: 'recommend',
    label: '推荐',
    sites: [
      { label: '微信读书', url: 'https://weread.qq.com/web' },
      { label: '知乎', url: 'https://www.zhihu.com' },
      { label: 'B站', url: 'https://www.bilibili.com' },
      { label: '豆瓣', url: 'https://www.douban.com' }
    ]
  },
  {
    id: 'novel',
    label: '小说',
    sites: [
      { label: '起点中文', url: 'https://www.qidian.com' },
      { label: '番茄小说', url: 'https://fanqienovel.com' },
      { label: '七猫小说', url: 'https://www.qimao.com' }
    ]
  },
  {
    id: 'video',
    label: '视频',
    sites: [
      { label: 'B站', url: 'https://www.bilibili.com' },
      { label: 'YouTube', url: 'https://www.youtube.com' }
    ]
  }
]

interface HomeViewProps {
  settings: AppSettings
  webviewPreload: string
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onStatusChange: (status: string) => void
  onImmersiveChange: (immersive: boolean) => void
}

export default function HomeView({
  settings,
  webviewPreload,
  onSettingsChange,
  onStatusChange,
  onImmersiveChange
}: HomeViewProps): JSX.Element {
  const webviewRef = useRef<Electron.WebviewTag | null>(null)
  const [urlInput, setUrlInput] = useState(settings.lastUrl)
  const [categoryId, setCategoryId] = useState('recommend')
  const [browsing, setBrowsing] = useState(false)
  const [browsingUrl, setBrowsingUrl] = useState(settings.lastUrl)

  const applyTransparency = useCallback((): void => {
    const webview = webviewRef.current
    if (!webview) return
    webview.setZoomFactor(1)
    webview.send('content-transparency', settings.transparentMode ?? true)
    webview.send('content-opacity', settings.contentOpacity)
  }, [settings.contentOpacity, settings.transparentMode])

  const category = CATEGORIES.find((item) => item.id === categoryId) ?? CATEGORIES[0]

  const openUrl = useCallback(
    (rawUrl: string): void => {
      const nextUrl = normalizeUrl(rawUrl, settings.searchEngine)
      if (!nextUrl) return

      setUrlInput(rawUrl.trim() || nextUrl)
      setBrowsingUrl(nextUrl)
      setBrowsing(true)
      onStatusChange('加载中')
      void onSettingsChange({ lastUrl: nextUrl })
    },
    [onSettingsChange, onStatusChange, settings.searchEngine]
  )

  useEffect(() => {
    return window.stealth.onBrowserTabSwitch((direction) => {
      const webview = webviewRef.current
      if (!webview || !browsing) return
      if (direction === 'prev' && webview.canGoBack()) {
        webview.goBack()
      }
      if (direction === 'next' && webview.canGoForward()) {
        webview.goForward()
      }
    })
  }, [browsing])

  useEffect(() => {
    return window.stealth.onContentOpacityChanged((opacity) => {
      webviewRef.current?.send('content-opacity', opacity)
    })
  }, [])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !browsing) return

    const handleReady = (): void => {
      applyTransparency()
      onStatusChange('浏览中')
    }

    const handleNavigate = (event: Event & { url?: string }): void => {
      const nextUrl = event.url ?? webview.getURL()
      if (!nextUrl || nextUrl === 'about:blank') return
      setUrlInput(nextUrl)
      void onSettingsChange({ lastUrl: nextUrl })
      applyTransparency()
    }

    webview.addEventListener('dom-ready', handleReady)
    webview.addEventListener('did-stop-loading', handleReady)
    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)

    return () => {
      webview.removeEventListener('dom-ready', handleReady)
      webview.removeEventListener('did-stop-loading', handleReady)
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
    }
  }, [applyTransparency, browsing, onSettingsChange, onStatusChange])

  useEffect(() => {
    if (browsing) applyTransparency()
  }, [applyTransparency, browsing, settings.transparentMode, settings.contentOpacity])

  useEffect(() => {
    onImmersiveChange(browsing)
  }, [browsing, onImmersiveChange])

  const toggleTransparentMode = (): void => {
    const next = !settings.transparentMode
    onSettingsChange({ transparentMode: next })
    webviewRef.current?.send('content-transparency', next)
  }

  if (browsing) {
    return (
      <div className="page page--browser">
        <div className="page-toolbar">
          <div className="page-toolbar__main">
            <button type="button" className="icon-btn" onClick={() => setBrowsing(false)} aria-label="返回">
              ←
            </button>
            <div className="search-bar search-bar--compact">
              <span className="search-bar__icon" aria-hidden="true">
                ⌁
              </span>
              <input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && openUrl(urlInput)}
              />
              <button type="button" className="search-bar__go" onClick={() => openUrl(urlInput)} aria-label="打开">
                →
              </button>
            </div>
            <button type="button" className="icon-btn" onClick={() => webviewRef.current?.reload()} aria-label="刷新">
              ↻
            </button>
          </div>
        </div>
        <div className="browser-viewport">
          <webview
            ref={webviewRef}
            src={browsingUrl}
            preload={webviewPreload}
            partition="persist:stealth"
            allowpopups="true"
            webpreferences="contextIsolation=yes, transparent=yes"
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page page--home">
      <div className="search-bar">
        <span className="search-bar__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && openUrl(urlInput)}
          placeholder="输入网址或搜索内容…"
        />
        <button type="button" className="search-bar__go" onClick={() => openUrl(urlInput)} aria-label="打开">
          →
        </button>
      </div>

      <div className="quick-actions">
        <label className="toggle toggle--light">
          <input type="checkbox" checked={settings.transparentMode} onChange={toggleTransparentMode} />
          <span className="toggle__track" aria-hidden="true" />
          <span className="toggle__label">网页透明</span>
        </label>
        <button type="button" className="text-btn" onClick={() => void window.stealth.toggleVisibility()}>
          一键隐藏
        </button>
      </div>

      <div className="portal-card">
        <nav className="portal-nav">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === categoryId ? 'is-active' : undefined}
              onClick={() => setCategoryId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="portal-grid">
          {category.sites.map((site) => (
            <button key={site.url} type="button" className="portal-link" onClick={() => openUrl(site.url)}>
              {site.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
