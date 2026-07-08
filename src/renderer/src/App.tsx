import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActiveTab, AppSettings, LockPublicState } from '../../../preload/types'
import BootScreen from './components/BootScreen'
import BottomNav from './components/BottomNav'
import LockScreenOverlay from './components/LockScreenOverlay'
import { PageNavBar, TopBar } from './components/PageHeader'
import ShelfSettingsDrawer from './components/shelf/ShelfSettingsDrawer'
import BookshelfView from './views/BookshelfView'
import HomeView from './views/HomeView'
import SettingsView from './views/SettingsView'
import BrowserBottomBar from './components/browser/BrowserBottomBar'
import { importBooksFlow } from './booksImport'
import { normalizeUrl } from './url'

export default function App(): JSX.Element {
  const initialSrcRef = useRef<string | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [status, setStatus] = useState('加载中')
  const [shellHidden, setShellHidden] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const [browserBrowsing, setBrowserBrowsing] = useState(false)
  const [browserCurrentUrl, setBrowserCurrentUrl] = useState('')
  const [booksRefreshKey, setBooksRefreshKey] = useState(0)
  const [shelfDrawerOpen, setShelfDrawerOpen] = useState(false)
  const [lockState, setLockState] = useState<LockPublicState>({
    locked: false,
    preview: false,
    hasPassword: false
  })

  const refreshLockState = useCallback(() => {
    void window.stealth.getLockState().then(setLockState)
  }, [])

  useEffect(() => {
    void Promise.all([window.stealth.getSettings(), window.stealth.getLockState()]).then(([loaded, lock]) => {
      initialSrcRef.current = normalizeUrl(loaded.lastUrl)
      setSettings(loaded)
      setLockState(lock)
      setStatus('就绪')
    })
  }, [])

  useEffect(() => {
    return window.stealth.onAutoHideStateChanged(({ hidden }) => {
      setShellHidden(hidden)
    })
  }, [])

  useEffect(() => {
    return window.stealth.onLockStateChanged(setLockState)
  }, [])

  useEffect(() => {
    const notify = (): void => {
      if (lockState.locked) return
      window.stealth.notifyLockActivity()
    }

    window.addEventListener('pointerdown', notify)
    window.addEventListener('keydown', notify)
    return () => {
      window.removeEventListener('pointerdown', notify)
      window.removeEventListener('keydown', notify)
    }
  }, [lockState.locked])

  const saveSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev))
    void window.stealth.saveSettings(partial)
  }, [])

  const handleImportBooks = useCallback(() => {
    setStatus('导入中')
    void importBooksFlow().then((message) => {
      setStatus(message)
      setBooksRefreshKey((key) => key + 1)
    })
  }, [])

  useEffect(() => {
    setImmersive(false)
    setBrowserBrowsing(false)
    setBrowserCurrentUrl('')
    setShelfDrawerOpen(false)
  }, [settings?.activeTab])

  useEffect(() => {
    if (immersive) {
      setShelfDrawerOpen(false)
    }
  }, [immersive])

  if (!settings) {
    return <BootScreen />
  }

  return (
    <div className={`shell${shellHidden ? ' shell--hidden' : ''}${settings.ghostMode ? ' shell--ghost' : ''}`}>
      <div
        className={`shell__main${immersive ? ' shell__main--immersive' : ''}${
          browserBrowsing ? ' shell__main--browser' : ''
        }${!immersive && settings.activeTab === 'settings' ? ' shell__main--no-nav' : ''}`}
      >
        <TopBar
          ghostMode={settings.ghostMode}
          autoHide={settings.autoHide}
          onToggleGhostMode={() => saveSettings({ ghostMode: !settings.ghostMode })}
          onToggleAutoHide={() => saveSettings({ autoHide: !settings.autoHide })}
        />

        {!immersive && settings.activeTab !== 'settings' ? (
          <PageNavBar
            activeTab={settings.activeTab}
            showLockButton={
              settings.activeTab === 'home' &&
              settings.lockEnabled &&
              settings.lockShowHomeButton &&
              lockState.hasPassword
            }
            onLock={() => void window.stealth.lockApp()}
            onImportBooks={settings.activeTab === 'bookshelf' ? handleImportBooks : undefined}
            onOpenShelfSettings={
              settings.activeTab === 'bookshelf' ? () => setShelfDrawerOpen((open) => !open) : undefined
            }
            shelfSettingsOpen={shelfDrawerOpen}
          />
        ) : null}

        <ShelfSettingsDrawer
          open={settings.activeTab === 'bookshelf' && shelfDrawerOpen}
          settings={settings}
          onClose={() => setShelfDrawerOpen(false)}
          onSettingsChange={saveSettings}
        />

        <div className="shell__content">
          {settings.activeTab === 'home' ? (
            <HomeView
              settings={settings}
              onSettingsChange={saveSettings}
              onStatusChange={setStatus}
              onImmersiveChange={setImmersive}
              onBrowsingChange={setBrowserBrowsing}
              onBrowsingUrlChange={setBrowserCurrentUrl}
            />
          ) : null}

          {settings.activeTab === 'bookshelf' ? (
            <BookshelfView
              settings={settings}
              refreshKey={booksRefreshKey}
              onSettingsChange={saveSettings}
              onStatusChange={setStatus}
              onImmersiveChange={setImmersive}
            />
          ) : null}

          {settings.activeTab === 'settings' ? (
            <SettingsView
              settings={settings}
              lockState={lockState}
              onSettingsChange={saveSettings}
              onRefreshLockState={refreshLockState}
              onWindowOpacityChange={(value) => {
                saveSettings({ windowOpacity: value })
                void window.stealth.setWindowOpacity(value)
              }}
              onContentOpacityChange={(value) => {
                saveSettings({ contentOpacity: value })
                void window.stealth.setContentOpacity(value)
              }}
            />
          ) : null}
        </div>

        <LockScreenOverlay
          settings={settings}
          lockState={lockState}
          onUnlocked={refreshLockState}
        />

        {browserBrowsing ? (
          <BrowserBottomBar
            settings={settings}
            currentUrl={browserCurrentUrl}
            onSettingsChange={saveSettings}
          />
        ) : !immersive ? (
          <div className="bottom-nav-bar">
            <BottomNav activeTab={settings.activeTab} onChange={(activeTab) => saveSettings({ activeTab })} />
          </div>
        ) : null}
      </div>

      <div className="shell__status" aria-live="polite">
        {status}
      </div>
    </div>
  )
}
