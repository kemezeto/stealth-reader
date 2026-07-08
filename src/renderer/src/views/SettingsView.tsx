import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Keyboard,
  Lock,
  Maximize2,
  Palette,
  Search,
  Settings2,
  SlidersHorizontal
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppSettings } from '../../../preload/types'
import ShortcutsPanel from '../components/settings/ShortcutsPanel'
import WindowSizePanel from '../components/settings/WindowSizePanel'
import DefaultSearchPanel from '../components/settings/DefaultSearchPanel'
import BrowserCachePanel from '../components/settings/BrowserCachePanel'
import OtherSettingsPanel from '../components/settings/OtherSettingsPanel'
import InterfaceLockPanel from '../components/settings/InterfaceLockPanel'
import type { LockPublicState } from '../../../preload/types'

type SettingsSection =
  | 'features'
  | 'shortcuts'
  | 'lock'
  | 'background'
  | 'window-size'
  | 'search'
  | 'cache'
  | 'other'

interface SettingsViewProps {
  settings: AppSettings
  lockState: LockPublicState
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onRefreshLockState: () => void
  onWindowOpacityChange: (value: number) => void
}

const MENU_ITEMS: Array<{ id: SettingsSection; label: string; icon: LucideIcon }> = [
  { id: 'features', label: '功能设置', icon: SlidersHorizontal },
  { id: 'shortcuts', label: '快捷键', icon: Keyboard },
  { id: 'lock', label: '界面锁定', icon: Lock },
  { id: 'background', label: '背景色', icon: Palette },
  { id: 'window-size', label: '默认窗口尺寸', icon: Maximize2 },
  { id: 'search', label: '默认搜索', icon: Search },
  { id: 'cache', label: '网页缓存', icon: Globe },
  { id: 'other', label: '其他设置', icon: Settings2 }
]

const SECTION_TITLES: Record<SettingsSection, string> = {
  features: '功能设置',
  shortcuts: '快捷键',
  lock: '界面锁定',
  background: '背景色',
  'window-size': '默认窗口尺寸',
  search: '默认搜索',
  cache: '网页缓存',
  other: '其他设置'
}

export default function SettingsView({
  settings,
  lockState,
  onSettingsChange,
  onRefreshLockState,
  onWindowOpacityChange
}: SettingsViewProps): JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null)

  const renderSectionBody = (): JSX.Element => {
    if (!activeSection) return <></>

    switch (activeSection) {
      case 'features':
        return (
          <div className="settings-detail">
            <label className="settings-row">
              <span>窗口透明度</span>
              <div className="settings-row__control">
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={settings.windowOpacity}
                  onChange={(event) => onWindowOpacityChange(Number(event.target.value))}
                />
                <strong>{settings.windowOpacity}%</strong>
              </div>
            </label>
            <label className="settings-row settings-row--toggle">
              <span>鼠标移出自动隐藏</span>
              <label className="toggle toggle--light">
                <input
                  type="checkbox"
                  checked={settings.autoHide}
                  onChange={(event) => onSettingsChange({ autoHide: event.target.checked })}
                />
                <span className="toggle__track" aria-hidden="true" />
              </label>
            </label>
            <label className="settings-row settings-row--toggle">
              <span>系统截图保护</span>
              <label className="toggle toggle--light">
                <input
                  type="checkbox"
                  checked={settings.contentProtection}
                  onChange={(event) => onSettingsChange({ contentProtection: event.target.checked })}
                />
                <span className="toggle__track" aria-hidden="true" />
              </label>
            </label>
            <p className="settings-note settings-note--compact">
              开启后截图/录屏时窗口区域将尽量显示为透明（露出后方内容），而非黑色遮挡。
            </p>
            <label className="settings-row settings-row--toggle">
              <span>窗口置顶</span>
              <label className="toggle toggle--light">
                <input
                  type="checkbox"
                  checked={settings.alwaysOnTop}
                  onChange={(event) => onSettingsChange({ alwaysOnTop: event.target.checked })}
                />
                <span className="toggle__track" aria-hidden="true" />
              </label>
            </label>
          </div>
        )

      case 'shortcuts':
        return <ShortcutsPanel settings={settings} onSettingsChange={onSettingsChange} />

      case 'lock':
        return (
          <InterfaceLockPanel
            settings={settings}
            lockState={lockState}
            onSettingsChange={onSettingsChange}
            onRefreshLockState={onRefreshLockState}
          />
        )

      case 'background':
        return (
          <div className="settings-detail">
            <label className="settings-row settings-row--toggle">
              <span>透明模式</span>
              <label className="toggle toggle--light">
                <input
                  type="checkbox"
                  checked={settings.ghostMode}
                  onChange={(event) => onSettingsChange({ ghostMode: event.target.checked })}
                />
                <span className="toggle__track" aria-hidden="true" />
              </label>
            </label>
            <p className="settings-note">开启后仅保留文字与按钮，界面背景透明。</p>
          </div>
        )

      case 'window-size':
        return <WindowSizePanel settings={settings} onSettingsChange={onSettingsChange} />

      case 'search':
        return <DefaultSearchPanel settings={settings} onSettingsChange={onSettingsChange} />

      case 'cache':
        return <BrowserCachePanel />

      case 'other':
        return <OtherSettingsPanel settings={settings} onSettingsChange={onSettingsChange} />

      default:
        return <></>
    }
  }

  return (
    <div className="page page--settings">
      <div className="settings-panel">
        {activeSection ? (
          <>
            <header className="settings-panel__header">
              <button type="button" className="settings-panel__back" onClick={() => setActiveSection(null)}>
                <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
                返回
              </button>
              <h2 className="settings-panel__title">{SECTION_TITLES[activeSection]}</h2>
            </header>
            <div className="settings-panel__body">{renderSectionBody()}</div>
          </>
        ) : (
          <>
            <header className="settings-panel__header">
              <h2 className="settings-panel__title">设置</h2>
            </header>
            <ul className="settings-panel__list">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon

                return (
                  <li key={item.id}>
                    <button type="button" className="settings-menu-item" onClick={() => setActiveSection(item.id)}>
                      <span className="settings-menu-item__icon" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span className="settings-menu-item__label">{item.label}</span>
                      <ChevronRight className="settings-menu-item__chevron" size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
