import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { AppSettings } from '../../../../preload/types'
import { formatSiteHostname, PORTAL_CATEGORIES } from '../../config/portal-sites'

interface PortalHomeProps {
  settings: AppSettings
  urlInput: string
  onUrlInputChange: (value: string) => void
  onOpenUrl: (url: string) => void
  onToggleTransparent: () => void
}

export default function PortalHome({
  settings,
  urlInput,
  onUrlInputChange,
  onOpenUrl,
  onToggleTransparent
}: PortalHomeProps): JSX.Element {
  const [categoryId, setCategoryId] = useState('recommend')
  const category = PORTAL_CATEGORIES.find((item) => item.id === categoryId) ?? PORTAL_CATEGORIES[0]
  const lastHostname = formatSiteHostname(settings.lastUrl)

  return (
    <div className="page page--home">
      <div className="search-bar">
        <span className="search-bar__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={urlInput}
          onChange={(event) => onUrlInputChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onOpenUrl(urlInput)}
          placeholder="输入网址或搜索内容…"
        />
        <button type="button" className="search-bar__go" onClick={() => onOpenUrl(urlInput)} aria-label="打开">
          →
        </button>
      </div>

      <div className="quick-actions">
        <label className="toggle toggle--light">
          <input type="checkbox" checked={settings.transparentMode} onChange={onToggleTransparent} />
          <span className="toggle__track" aria-hidden="true" />
          <span className="toggle__label">网页透明</span>
        </label>
        <button type="button" className="text-btn" onClick={() => void window.stealth.toggleVisibility()}>
          一键隐藏
        </button>
      </div>

      {settings.lastUrl ? (
        <button type="button" className="continue-browse" onClick={() => onOpenUrl(settings.lastUrl)}>
          <span className="continue-browse__icon" aria-hidden="true">
            <ExternalLink size={16} strokeWidth={2} />
          </span>
          <span className="continue-browse__text">
            <span className="continue-browse__label">继续浏览</span>
            <span className="continue-browse__url">{lastHostname}</span>
          </span>
        </button>
      ) : null}

      <div className="portal-card">
        <nav className="portal-nav">
          {PORTAL_CATEGORIES.map((item) => (
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
            <button key={site.url} type="button" className="portal-link" onClick={() => onOpenUrl(site.url)}>
              {site.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
