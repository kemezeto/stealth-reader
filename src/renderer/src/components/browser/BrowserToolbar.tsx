import { ArrowLeft, Home, RotateCw, Star } from 'lucide-react'

interface BrowserToolbarProps {
  urlInput: string
  canGoBack: boolean
  isLoading: boolean
  isBookmarked: boolean
  onUrlInputChange: (value: string) => void
  onNavigate: () => void
  onToggleBookmark: () => void
  onGoBack: () => void
  onReload: () => void
  onExit: () => void
}

export default function BrowserToolbar({
  urlInput,
  canGoBack,
  isLoading,
  isBookmarked,
  onUrlInputChange,
  onNavigate,
  onToggleBookmark,
  onGoBack,
  onReload,
  onExit
}: BrowserToolbarProps): JSX.Element {
  return (
    <div className="page-toolbar browser-toolbar">
      <div className="page-toolbar__main browser-toolbar__main">
        <div className="browser-toolbar__nav">
          <button
            type="button"
            className="icon-btn"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onExit}
            aria-label="返回首页"
          >
            <Home size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onGoBack}
            disabled={!canGoBack}
            aria-label="后退"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`icon-btn${isLoading ? ' icon-btn--loading' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onReload}
            aria-label="刷新"
          >
            <RotateCw size={18} strokeWidth={2} className={isLoading ? 'browser-spinner' : undefined} />
          </button>
        </div>

        <div className="search-bar search-bar--compact browser-toolbar__url">
          <input
            value={urlInput}
            onChange={(event) => onUrlInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onNavigate()
              if (event.key === 'Escape') event.currentTarget.blur()
            }}
            aria-label="地址栏"
          />
          <button
            type="button"
            className={`browser-toolbar__bookmark${isBookmarked ? ' is-active' : ''}`}
            onClick={onToggleBookmark}
            disabled={!urlInput.trim()}
            aria-label={isBookmarked ? '取消收藏' : '收藏当前页'}
            aria-pressed={isBookmarked}
          >
            <Star size={16} strokeWidth={2} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}
