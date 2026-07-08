import { useEffect, useState } from 'react'
import { ArrowLeftRight, Lock, Minus, MousePointer2, Pin, Settings, SquareArrowOutDownLeft, X } from 'lucide-react'
import type { ActiveTab } from '../../../preload/types'

const TITLES: Record<ActiveTab, string> = {
  home: '首页',
  bookshelf: '书架',
  notes: '笔记',
  settings: '我的'
}

interface PageNavBarProps {
  activeTab: ActiveTab
  showLockButton?: boolean
  onLock?: () => void
  onImportBooks?: () => void
  onOpenShelfSettings?: () => void
  shelfSettingsOpen?: boolean
}

interface WindowControlsProps {
  ghostMode: boolean
  autoHide: boolean
  onToggleGhostMode: () => void
  onToggleAutoHide: () => void
}

interface TopBarProps {
  ghostMode: boolean
  autoHide: boolean
  onToggleGhostMode: () => void
  onToggleAutoHide: () => void
}

export function WindowControls({
  ghostMode,
  autoHide,
  onToggleGhostMode,
  onToggleAutoHide
}: WindowControlsProps): JSX.Element {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)

  useEffect(() => {
    void window.stealth.getSettings().then((settings) => {
      setAlwaysOnTop(settings.alwaysOnTop ?? false)
    })
  }, [])

  const toggleAlwaysOnTop = (): void => {
    void window.stealth.toggleAlwaysOnTop().then(setAlwaysOnTop)
  }

  return (
    <div className="window-controls">
      {ghostMode ? (
        <button
          type="button"
          className={autoHide ? 'win-btn win-btn--active' : 'win-btn'}
          onClick={onToggleAutoHide}
          aria-label={autoHide ? '关闭移出自动隐藏' : '开启移出自动隐藏'}
          aria-pressed={autoHide}
          title={autoHide ? '已开启：鼠标移出自动隐藏' : '已关闭：鼠标移出自动隐藏'}
        >
          <MousePointer2 size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        className={ghostMode ? 'win-btn win-btn--active' : 'win-btn'}
        onClick={onToggleGhostMode}
        aria-label={ghostMode ? '退出透明模式' : '进入透明模式'}
        aria-pressed={ghostMode}
        title={ghostMode ? '退出透明模式' : '透明模式：仅保留文字与按钮'}
      >
        <ArrowLeftRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={alwaysOnTop ? 'win-btn win-btn--active' : 'win-btn'}
        onClick={toggleAlwaysOnTop}
        aria-label={alwaysOnTop ? '取消置顶' : '窗口置顶'}
        aria-pressed={alwaysOnTop}
        title={alwaysOnTop ? '取消置顶' : '窗口置顶'}
      >
        <Pin size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="win-btn" onClick={() => void window.stealth.toggleVisibility()} aria-label="隐藏窗口" title="隐藏窗口">
        <SquareArrowOutDownLeft size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="win-btn" onClick={() => window.stealth.minimize()} aria-label="最小化" title="最小化">
        <Minus size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="win-btn win-btn--close" onClick={() => window.stealth.close()} aria-label="关闭" title="关闭">
        <X size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}

export function TopBar({ ghostMode, autoHide, onToggleGhostMode, onToggleAutoHide }: TopBarProps): JSX.Element {
  return (
    <header className="top-bar" aria-label="窗口操作">
      <WindowControls
        ghostMode={ghostMode}
        autoHide={autoHide}
        onToggleGhostMode={onToggleGhostMode}
        onToggleAutoHide={onToggleAutoHide}
      />
    </header>
  )
}

export function PageNavBar({
  activeTab,
  showLockButton = false,
  onLock,
  onImportBooks,
  onOpenShelfSettings,
  shelfSettingsOpen = false
}: PageNavBarProps): JSX.Element {
  const showSettingsShortcut = activeTab === 'bookshelf' && onOpenShelfSettings
  const showUpload = activeTab === 'bookshelf' && onImportBooks

  return (
    <nav className="page-nav-bar" aria-label="页面导航">
      <div className="page-nav-bar__zone page-nav-bar__zone--left">
        {showLockButton ? (
          <button type="button" className="nav-bar-btn nav-bar-btn--icon" onClick={onLock} aria-label="锁定界面" title="锁定界面">
            <Lock size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        {showSettingsShortcut ? (
          <button
            type="button"
            className={shelfSettingsOpen ? 'nav-bar-btn nav-bar-btn--icon is-active' : 'nav-bar-btn nav-bar-btn--icon'}
            onClick={onOpenShelfSettings}
            aria-label="书架设置"
            aria-expanded={shelfSettingsOpen}
            title="书架设置"
          >
            <Settings size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <h1 className="page-nav-bar__title">{TITLES[activeTab]}</h1>

      <div className="page-nav-bar__zone page-nav-bar__zone--right">
        {showUpload ? (
          <button type="button" className="nav-bar-btn nav-bar-btn--accent" onClick={onImportBooks}>
            上传
          </button>
        ) : null}
      </div>
    </nav>
  )
}
