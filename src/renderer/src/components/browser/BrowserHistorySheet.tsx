import { Trash2 } from 'lucide-react'
import type { AppSettings } from '../../../../preload/types'
import {
  clearBrowserHistory,
  formatHistorySubtitle,
  formatHistoryTime,
  removeBrowserHistoryEntry
} from './browser-history'

interface BrowserHistorySheetProps {
  open: boolean
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onClose: () => void
}

export default function BrowserHistorySheet({
  open,
  settings,
  onSettingsChange,
  onClose
}: BrowserHistorySheetProps): JSX.Element | null {
  const history = settings.browserHistory ?? []

  if (!open) return null

  const openHistoryItem = (url: string): void => {
    void window.stealth.browserNavigate(url)
    onSettingsChange({ lastUrl: url })
    onClose()
  }

  const removeItem = (id: string): void => {
    onSettingsChange({
      browserHistory: removeBrowserHistoryEntry(history, id)
    })
  }

  const clearAll = (): void => {
    onSettingsChange({ browserHistory: clearBrowserHistory() })
  }

  return (
    <div className="browser-history-sheet-wrap">
      <button type="button" className="browser-history-sheet__backdrop" aria-label="关闭历史记录" onClick={onClose} />

      <section className="browser-history-sheet" aria-label="浏览历史">
        <div className="browser-history-sheet__header">
          <span className="browser-history-sheet__heading">历史记录</span>
          <button
            type="button"
            className="browser-history-sheet__clear"
            disabled={history.length === 0}
            onClick={clearAll}
          >
            清空
          </button>
        </div>

        {history.length === 0 ? (
          <p className="browser-history-sheet__empty">暂无浏览记录</p>
        ) : (
          <ul className="browser-history-sheet__list">
            {history.map((item) => (
              <li key={item.id} className="browser-history-sheet__item">
                <button
                  type="button"
                  className="browser-history-sheet__open"
                  onClick={() => openHistoryItem(item.url)}
                >
                  <span className="browser-history-sheet__row">
                    <span className="browser-history-sheet__title">{item.title}</span>
                    <span className="browser-history-sheet__time">{formatHistoryTime(item.visitedAt)}</span>
                  </span>
                  <span className="browser-history-sheet__url">{formatHistorySubtitle(item.url)}</span>
                </button>
                <button
                  type="button"
                  className="browser-history-sheet__remove"
                  aria-label={`删除 ${item.title}`}
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
