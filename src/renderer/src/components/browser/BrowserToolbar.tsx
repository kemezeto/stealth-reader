import { ArrowLeft, ArrowRight, Home, LoaderCircle, RotateCw } from 'lucide-react'

interface BrowserToolbarProps {
  urlInput: string
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  transparentMode: boolean
  onUrlInputChange: (value: string) => void
  onNavigate: () => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
  onExit: () => void
  onToggleTransparent: () => void
}

export default function BrowserToolbar({
  urlInput,
  canGoBack,
  canGoForward,
  isLoading,
  transparentMode,
  onUrlInputChange,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onExit,
  onToggleTransparent
}: BrowserToolbarProps): JSX.Element {
  return (
    <div className="page-toolbar browser-toolbar">
      <div className="page-toolbar__main">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="返回首页">
          <Home size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onGoBack}
          disabled={!canGoBack}
          aria-label="后退"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onGoForward}
          disabled={!canGoForward}
          aria-label="前进"
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
        <div className="search-bar search-bar--compact">
          <span className="search-bar__icon" aria-hidden="true">
            {isLoading ? <LoaderCircle size={16} className="browser-spinner" /> : '⌁'}
          </span>
          <input
            value={urlInput}
            onChange={(event) => onUrlInputChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onNavigate()}
            aria-label="地址栏"
          />
          <button type="button" className="search-bar__go" onClick={onNavigate} aria-label="打开">
            →
          </button>
        </div>
        <button
          type="button"
          className={`icon-btn${isLoading ? ' icon-btn--loading' : ''}`}
          onClick={onReload}
          aria-label="刷新"
        >
          <RotateCw size={18} strokeWidth={2} className={isLoading ? 'browser-spinner' : undefined} />
        </button>
        <label className="toggle toggle--compact" title="网页透明">
          <input type="checkbox" checked={transparentMode} onChange={onToggleTransparent} />
          <span className="toggle__track" aria-hidden="true" />
          <span className="toggle__label">透明</span>
        </label>
      </div>
    </div>
  )
}
