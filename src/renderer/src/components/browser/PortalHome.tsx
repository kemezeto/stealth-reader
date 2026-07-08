import { useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { AppSettings } from '../../../../preload/types'
import { formatSiteHostname, PORTAL_CATEGORIES } from '../../config/portal-sites'
import { formatBookmarkSubtitle, removeBrowserBookmark } from './browser-bookmarks'
import {
  clearBrowserHistory,
  formatHistorySubtitle,
  formatHistoryTime,
  removeBrowserHistoryEntry
} from './browser-history'

type PortalPanel = 'history' | 'bookmarks' | (typeof PORTAL_CATEGORIES)[number]['id']

interface PortalHomeProps {
  settings: AppSettings
  onOpenUrl: (url: string) => void
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

export default function PortalHome({
  settings,
  onOpenUrl,
  onSettingsChange
}: PortalHomeProps): JSX.Element {
  const [activePanel, setActivePanel] = useState<PortalPanel>('recommend')
  const [urlInput, setUrlInput] = useState('')
  const category = PORTAL_CATEGORIES.find((item) => item.id === activePanel) ?? PORTAL_CATEGORIES[0]
  const lastHostname = formatSiteHostname(settings.lastUrl)
  const history = settings.browserHistory ?? []
  const bookmarks = settings.browserBookmarks ?? []

  return (
    <div className="page page--home">
      <div className="search-bar">
        <span className="search-bar__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onOpenUrl(urlInput)}
          placeholder="输入网址或搜索内容…"
        />
        <button type="button" className="search-bar__go" onClick={() => onOpenUrl(urlInput)} aria-label="打开">
          →
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
        <nav className="portal-nav" aria-label="站点分类">
          <div className="portal-nav__tabs">
            {PORTAL_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activePanel === item.id ? 'is-active' : undefined}
                onClick={() => setActivePanel(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="portal-nav__actions">
            <button
              type="button"
              className={activePanel === 'history' ? 'is-active' : undefined}
              onClick={() => setActivePanel('history')}
            >
              历史记录
            </button>
            <button
              type="button"
              className={activePanel === 'bookmarks' ? 'is-active' : undefined}
              onClick={() => setActivePanel('bookmarks')}
            >
              收藏夹
            </button>
          </div>
        </nav>

        {activePanel === 'history' ? (
          <div className="portal-panel">
            <div className="portal-panel__header">
              <span className="portal-panel__heading">历史记录</span>
              <button
                type="button"
                className="portal-panel__action"
                disabled={history.length === 0}
                onClick={() => onSettingsChange({ browserHistory: clearBrowserHistory() })}
              >
                清空
              </button>
            </div>
            {history.length === 0 ? (
              <p className="portal-panel__empty">暂无浏览记录</p>
            ) : (
              <ul className="portal-list">
                {history.map((item) => (
                  <li key={item.id} className="portal-list__item">
                    <button type="button" className="portal-list__open" onClick={() => onOpenUrl(item.url)}>
                      <span className="portal-list__title" title={item.title}>
                        {item.title}
                      </span>
                      <span className="portal-list__url" title={item.url}>
                        {formatHistorySubtitle(item.url)}
                      </span>
                      <span className="portal-list__meta">{formatHistoryTime(item.visitedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="portal-list__remove"
                      aria-label={`删除 ${item.title}`}
                      onClick={() =>
                        onSettingsChange({
                          browserHistory: removeBrowserHistoryEntry(history, item.id)
                        })
                      }
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activePanel === 'bookmarks' ? (
          <div className="portal-panel">
            <div className="portal-panel__header">
              <span className="portal-panel__heading">收藏夹</span>
            </div>
            {bookmarks.length === 0 ? (
              <p className="portal-panel__empty">暂无收藏，浏览网页时可添加收藏</p>
            ) : (
              <ul className="portal-list">
                {bookmarks.map((item) => (
                  <li key={item.id} className="portal-list__item">
                    <button type="button" className="portal-list__open" onClick={() => onOpenUrl(item.url)}>
                      <span className="portal-list__title" title={item.title}>
                        {item.title}
                      </span>
                      <span className="portal-list__url" title={item.url}>
                        {formatBookmarkSubtitle(item.url)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="portal-list__remove"
                      aria-label={`删除 ${item.title}`}
                      onClick={() =>
                        onSettingsChange({
                          browserBookmarks: removeBrowserBookmark(bookmarks, item.id)
                        })
                      }
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activePanel !== 'history' && activePanel !== 'bookmarks' ? (
          <div className="portal-grid">
            {category.sites.map((site) => (
              <button key={site.url} type="button" className="portal-link" onClick={() => onOpenUrl(site.url)}>
                {site.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
