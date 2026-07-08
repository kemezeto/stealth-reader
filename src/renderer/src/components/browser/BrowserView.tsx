import type { AppSettings } from '../../../../preload/types'
import type { WebviewBrowserState } from '../../hooks/useWebviewBrowser'
import BrowserToolbar from './BrowserToolbar'

interface BrowserViewProps {
  settings: AppSettings
  browser: WebviewBrowserState
  onExit: () => void
}

export default function BrowserView({ settings, browser, onExit }: BrowserViewProps): JSX.Element {
  const {
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
  } = browser

  return (
    <div className="page page--browser">
      <BrowserToolbar
        urlInput={urlInput}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        transparentMode={settings.transparentMode}
        onUrlInputChange={setUrlInput}
        onNavigate={() => loadUrl(urlInput)}
        onGoBack={goBack}
        onGoForward={goForward}
        onReload={reload}
        onExit={onExit}
        onToggleTransparent={toggleTransparentMode}
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
