import type { AppSettings } from '../../../../preload/types'
import type { WebviewBrowserState } from '../../hooks/useWebviewBrowser'
import { addBrowserBookmark, isBookmarked, removeBrowserBookmarkByUrl } from './browser-bookmarks'
import BrowserToolbar from './BrowserToolbar'
import { normalizeUrl } from '../../url'

interface BrowserViewProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  browser: WebviewBrowserState
  onExit: () => void
}

export default function BrowserView({
  settings,
  onSettingsChange,
  browser,
  onExit
}: BrowserViewProps): JSX.Element {
  const {
    viewportRef,
    urlInput,
    setUrlInput,
    canGoBack,
    isLoading,
    loadError,
    goBack,
    reload,
    loadUrl,
    clearError
  } = browser

  const bookmarks = settings.browserBookmarks ?? []
  const currentBookmarked = isBookmarked(bookmarks, urlInput)

  const toggleBookmark = (): void => {
    const url = normalizeUrl(urlInput, settings.searchEngine)
    if (!url) return

    if (isBookmarked(bookmarks, url)) {
      onSettingsChange({
        browserBookmarks: removeBrowserBookmarkByUrl(bookmarks, url)
      })
      return
    }

    onSettingsChange({
      browserBookmarks: addBrowserBookmark(bookmarks, url)
    })
  }

  return (
    <div className="page page--browser">
      <BrowserToolbar
        urlInput={urlInput}
        canGoBack={canGoBack}
        isLoading={isLoading}
        isBookmarked={currentBookmarked}
        onUrlInputChange={setUrlInput}
        onNavigate={() => loadUrl(urlInput)}
        onToggleBookmark={toggleBookmark}
        onGoBack={goBack}
        onReload={reload}
        onExit={onExit}
      />

      {loadError ? (
        <div className="browser-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="text-btn" onClick={() => { clearError(); reload() }}>
            重试
          </button>
        </div>
      ) : null}

      <div ref={viewportRef} className="browser-viewport browser-viewport--embedded" />
    </div>
  )
}
