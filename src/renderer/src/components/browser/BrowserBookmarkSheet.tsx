import { Trash2 } from 'lucide-react'
import type { AppSettings } from '../../../../preload/types'
import {
  addBrowserBookmark,
  formatBookmarkSubtitle,
  isBookmarked,
  removeBrowserBookmark
} from './browser-bookmarks'

interface BrowserBookmarkSheetProps {
  open: boolean
  settings: AppSettings
  currentUrl: string
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onClose: () => void
}

export default function BrowserBookmarkSheet({
  open,
  settings,
  currentUrl,
  onSettingsChange,
  onClose
}: BrowserBookmarkSheetProps): JSX.Element | null {
  const bookmarks = settings.browserBookmarks ?? []
  const currentSaved = isBookmarked(bookmarks, currentUrl)

  if (!open) return null

  const addCurrentPage = (): void => {
    if (currentSaved || !currentUrl) return
    onSettingsChange({
      browserBookmarks: addBrowserBookmark(bookmarks, currentUrl)
    })
  }

  const openBookmark = (url: string): void => {
    void window.stealth.browserNavigate(url)
    onSettingsChange({ lastUrl: url })
    onClose()
  }

  const removeBookmark = (id: string): void => {
    onSettingsChange({
      browserBookmarks: removeBrowserBookmark(bookmarks, id)
    })
  }

  return (
    <div className="browser-bookmark-sheet-wrap">
      <button type="button" className="browser-bookmark-sheet__backdrop" aria-label="关闭收藏夹" onClick={onClose} />

      <section className="browser-bookmark-sheet" aria-label="网页收藏夹">
        <div className="browser-bookmark-sheet__header">
          <span className="browser-bookmark-sheet__heading">收藏夹</span>
          <button
            type="button"
            className="browser-bookmark-sheet__add"
            disabled={currentSaved || !currentUrl}
            onClick={addCurrentPage}
          >
            {currentSaved ? '已收藏' : '添加当前页'}
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <p className="browser-bookmark-sheet__empty">暂无收藏，点击右上角添加当前页面</p>
        ) : (
          <ul className="browser-bookmark-sheet__list">
            {bookmarks.map((item) => (
              <li key={item.id} className="browser-bookmark-sheet__item">
                <button
                  type="button"
                  className="browser-bookmark-sheet__open"
                  onClick={() => openBookmark(item.url)}
                >
                  <span className="browser-bookmark-sheet__title">{item.title}</span>
                  <span className="browser-bookmark-sheet__url">{formatBookmarkSubtitle(item.url)}</span>
                </button>
                <button
                  type="button"
                  className="browser-bookmark-sheet__remove"
                  aria-label={`删除 ${item.title}`}
                  onClick={() => removeBookmark(item.id)}
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
