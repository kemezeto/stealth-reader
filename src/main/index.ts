import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { createAutoHideTracker } from './pointer/auto-hide-tracker'
import { applyCaptureProtection } from './content-protection'
import { resolveAppIconPath } from './app-paths'
import { syncAutoLaunch } from './auto-launch'
import { disposeTray, ensureTray } from './tray'
import { passwordLockManager } from './password-lock'
import {
  canRegisterGlobalShortcut,
  disposeGlobalHotkeys,
  sendBrowserTabSwitch,
  syncGlobalHotkeys as registerGlobalHotkeys,
  type GlobalHotkeySettings
} from './hotkeys'

import { registerBooksIpc } from './books/ipc'
import { registerBookProtocol, registerBookScheme } from './books/protocol'
import {
  clampWindowSize,
  inferWindowSizePreset,
  WINDOW_SIZE_LIMITS,
  WINDOW_SIZE_PRESETS,
  type WindowSizePreset
} from '../shared/window-size'
import { scheduleWindowRedraw } from './window-redraw'
import { BrowserViewManager } from './browser/browser-view-manager'
import { createBrowserToolbarRevealTracker } from './browser/browser-toolbar-reveal-tracker'

registerBookScheme()

if (process.platform === 'win32') {
  // 避免 BrowserView 聚焦/失焦时透明窗口被 Windows 判定为不可见而停止绘制
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
}

interface AppSettings {
  windowOpacity: number
  contentOpacity: number
  autoHide: boolean
  alwaysOnTop: boolean
  ghostMode: boolean
  contentProtection: boolean
  transparentMode: boolean
  activeTab: 'home' | 'bookshelf' | 'settings'
  lastBookId: string | null
  readerFontSize: number
  epubFontColor: string
  epubLineHeight: number
  readerPrevPage: string
  readerNextPage: string
  bossKey1: string
  bossKey2: string
  bossKeyEnabled: boolean
  browserTabPrev: string
  browserTabNext: string
  browserTabSwitchEnabled: boolean
  browserToolbarAutoHide: boolean
  browserShowScrollbar: boolean
  browserZoomPercent: number
  browserZoomScope: 'domain' | 'global'
  browserZoomByDomain: Record<string, number>
  browserBookmarks: Array<{ id: string; title: string; url: string; createdAt: number }>
  browserHistory: Array<{ id: string; title: string; url: string; visitedAt: number }>
  windowWidth: number
  windowHeight: number
  windowSizePreset: WindowSizePreset
  searchEngine: 'bing' | 'baidu' | 'google'
  autoLaunch: boolean
  closeAction: 'minimize' | 'quit'
  lockEnabled: boolean
  lockAutoLockEnabled: boolean
  lockAutoLockMinutes: number
  lockShortcut: string
  lockShowHomeButton: boolean
  lockDisplayName: string
  lockScreenTheme: 'dark' | 'light'
  lockSkipDuringAutoPaging: boolean
  bossKey?: string
  lastUrl: string
}

const DEFAULT_SETTINGS: AppSettings = {
  windowOpacity: 92,
  contentOpacity: 100,
  autoHide: false,
  alwaysOnTop: false,
  ghostMode: false,
  contentProtection: false,
  transparentMode: true,
  activeTab: 'home',
  lastBookId: null,
  readerFontSize: 16,
  epubFontColor: '#1f2937',
  epubLineHeight: 2,
  readerPrevPage: 'A',
  readerNextPage: 'D',
  bossKey1: 'Alt+Q',
  bossKey2: 'Alt+X',
  bossKeyEnabled: true,
  browserTabPrev: 'Alt+A',
  browserTabNext: 'Alt+D',
  browserTabSwitchEnabled: false,
  browserToolbarAutoHide: false,
  browserShowScrollbar: true,
  browserZoomPercent: 100,
  browserZoomScope: 'domain',
  browserZoomByDomain: {},
  browserBookmarks: [],
  browserHistory: [],
  windowWidth: WINDOW_SIZE_PRESETS.portrait.width,
  windowHeight: WINDOW_SIZE_PRESETS.portrait.height,
  windowSizePreset: 'portrait',
  searchEngine: 'bing',
  autoLaunch: false,
  closeAction: 'minimize',
  lockEnabled: false,
  lockAutoLockEnabled: false,
  lockAutoLockMinutes: 30,
  lockShortcut: 'CommandOrControl+L',
  lockShowHomeButton: false,
  lockDisplayName: '',
  lockScreenTheme: 'light',
  lockSkipDuringAutoPaging: false,
  lastUrl: 'https://weread.qq.com/web'
}

let mainWindow: BrowserWindow | null = null
let browserViewManager: BrowserViewManager | null = null
let browserToolbarRevealTracker: ReturnType<typeof createBrowserToolbarRevealTracker> | null = null
let settings = loadSettings()
let autoHideTracker: ReturnType<typeof createAutoHideTracker> | null = null
let savedWindowBounds: Electron.Rectangle | null = null
let windowIsExpanded = false
let appIsQuitting = false

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings(): AppSettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppSettings> & { viewMode?: string; bossKey?: string }
    if (!parsed.activeTab) {
      if (parsed.viewMode === 'local') parsed.activeTab = 'bookshelf'
      else if (parsed.viewMode === 'web') parsed.activeTab = 'home'
    }
    if (parsed.bossKey && !parsed.bossKey1) {
      parsed.bossKey1 = parsed.bossKey
    }
    const merged = { ...DEFAULT_SETTINGS, ...parsed }
    if (typeof merged.windowWidth !== 'number' || typeof merged.windowHeight !== 'number') {
      merged.windowWidth = WINDOW_SIZE_PRESETS.portrait.width
      merged.windowHeight = WINDOW_SIZE_PRESETS.portrait.height
      merged.windowSizePreset = 'portrait'
    } else if (!merged.windowSizePreset) {
      merged.windowSizePreset = inferWindowSizePreset(merged.windowWidth, merged.windowHeight)
    }
    return merged
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const normalized: Partial<AppSettings> = { ...partial }

  if (
    typeof normalized.windowWidth === 'number' ||
    typeof normalized.windowHeight === 'number'
  ) {
    const clamped = clampWindowSize(
      normalized.windowWidth ?? settings.windowWidth,
      normalized.windowHeight ?? settings.windowHeight
    )
    normalized.windowWidth = clamped.width
    normalized.windowHeight = clamped.height
    if (!normalized.windowSizePreset) {
      normalized.windowSizePreset = inferWindowSizePreset(clamped.width, clamped.height)
    }
  }

  settings = { ...settings, ...normalized }
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  return settings
}

function applyWindowOpacity(opacity: number): void {
  if (!mainWindow) return
  const value = Math.max(0.15, Math.min(1, opacity / 100))
  mainWindow.setOpacity(value)
}

function applyAlwaysOnTop(enabled: boolean): void {
  mainWindow?.setAlwaysOnTop(enabled)
}

function syncCaptureProtection(): void {
  applyCaptureProtection(mainWindow, settings.contentProtection)
}

function syncAutoHideTracker(): void {
  autoHideTracker?.setEnabled(settings.autoHide)
}

function getGlobalHotkeySettings(): GlobalHotkeySettings {
  return {
    bossKey1: settings.bossKey1,
    bossKey2: settings.bossKey2,
    bossKeyEnabled: settings.bossKeyEnabled,
    browserTabPrev: settings.browserTabPrev,
    browserTabNext: settings.browserTabNext,
    browserTabSwitchEnabled: settings.browserTabSwitchEnabled,
    lockEnabled: settings.lockEnabled && passwordLockManager.hasPassword(),
    lockShortcut: settings.lockShortcut
  }
}

function syncLockSettings(): void {
  passwordLockManager.syncAutoLock(
    settings.lockAutoLockEnabled,
    settings.lockAutoLockMinutes,
    settings.lockEnabled
  )
  applyGlobalHotkeys()
}

function toggleBossKeyVisibility(): void {
  if (!mainWindow) return
  if (autoHideTracker?.isUserVisible() ?? mainWindow.isVisible()) {
    autoHideTracker?.notifyBossKeyHide()
    mainWindow.hide()
  } else {
    autoHideTracker?.notifyBossKeyShow()
    mainWindow.show()
    mainWindow.focus()
  }
}

function applyGlobalHotkeys(): void {
  registerGlobalHotkeys(getGlobalHotkeySettings(), {
    onBossKey1: toggleBossKeyVisibility,
    onBossKey2: () => requestQuit(),
    onBrowserTabPrev: () => sendBrowserTabSwitch(mainWindow, 'prev'),
    onBrowserTabNext: () => sendBrowserTabSwitch(mainWindow, 'next'),
    onLock: () => passwordLockManager.lock()
  })
}

function setupBrowserViewManager(): void {
  browserViewManager = new BrowserViewManager(() => mainWindow)
  browserViewManager.registerIpc()
  browserToolbarRevealTracker = createBrowserToolbarRevealTracker(() => mainWindow)
}

function requestQuit(): void {
  appIsQuitting = true
  disposeTray()
  app.quit()
}

function syncSystemPreferences(): void {
  syncAutoLaunch(settings.autoLaunch)

  if (settings.closeAction === 'minimize') {
    ensureTray(() => mainWindow, requestQuit, () => autoHideTracker?.forceReveal())
  } else {
    disposeTray()
  }
}

function handleWindowCloseRequest(): void {
  if (!mainWindow) return

  if (settings.closeAction === 'minimize' && !appIsQuitting) {
    mainWindow.hide()
    return
  }

  appIsQuitting = true
  mainWindow.close()
}

function toggleWindowMaximize(window: BrowserWindow): void {
  if (windowIsExpanded) {
    if (savedWindowBounds) {
      window.setBounds(savedWindowBounds)
    } else {
      window.unmaximize()
    }
    windowIsExpanded = false
    savedWindowBounds = null
    return
  }

  savedWindowBounds = window.getBounds()
  const display = screen.getDisplayMatching(savedWindowBounds)
  window.setBounds(display.workArea)
  windowIsExpanded = true
}

function resizeMainWindow(width: number, height: number): void {
  if (!mainWindow || windowIsExpanded) return

  const size = clampWindowSize(width, height)
  const bounds = mainWindow.getBounds()
  mainWindow.setMinimumSize(WINDOW_SIZE_LIMITS.minWidth, WINDOW_SIZE_LIMITS.minHeight)
  mainWindow.setBounds(
    {
      x: bounds.x,
      y: bounds.y,
      width: size.width,
      height: size.height
    },
    true
  )
}

function createWindow(): void {
  const iconPath = resolveAppIconPath()
  const initialSize = clampWindowSize(settings.windowWidth, settings.windowHeight)

  mainWindow = new BrowserWindow({
    width: initialSize.width,
    height: initialSize.height,
    minWidth: WINDOW_SIZE_LIMITS.minWidth,
    minHeight: WINDOW_SIZE_LIMITS.minHeight,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    roundedCorners: true,
    alwaysOnTop: settings.alwaysOnTop,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    applyWindowOpacity(settings.windowOpacity)
    applyAlwaysOnTop(settings.alwaysOnTop)
    syncCaptureProtection()
    syncAutoHideTracker()
  })

  mainWindow.on('show', () => {
    syncCaptureProtection()
    autoHideTracker?.forceReveal()
    scheduleWindowRedraw(mainWindow!, settings.windowOpacity)
  })

  mainWindow.on('focus', () => {
    autoHideTracker?.forceReveal()
    scheduleWindowRedraw(mainWindow!, settings.windowOpacity)
  })

  mainWindow.on('blur', () => {
    scheduleWindowRedraw(mainWindow!, settings.windowOpacity)
  })

  mainWindow.on('resize', () => {
    if (mainWindow?.isDestroyed()) return
    mainWindow.webContents.send('window-resized')
  })

  mainWindow.on('close', (event) => {
    if (appIsQuitting || settings.closeAction === 'quit') return
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    autoHideTracker?.dispose()
    autoHideTracker = null
    mainWindow = null
    windowIsExpanded = false
    savedWindowBounds = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupAutoHideTracker(): void {
  autoHideTracker = createAutoHideTracker(
    () => mainWindow,
    () => settings.autoHide,
    (hidden) => browserViewManager?.setAutoHideSuppressed(hidden)
  )
  syncAutoHideTracker()
}

function setupIpc(): void {
  registerBooksIpc(() => mainWindow)

  ipcMain.handle('get-settings', () => settings)

  ipcMain.handle('save-settings', (_event, partial: Partial<AppSettings>) => {
    const next = saveSettings(partial)
    if (typeof partial.windowOpacity === 'number') {
      applyWindowOpacity(next.windowOpacity)
    }
    if (
      typeof partial.bossKey1 === 'string' ||
      typeof partial.bossKey2 === 'string' ||
      typeof partial.bossKeyEnabled === 'boolean' ||
      typeof partial.browserTabPrev === 'string' ||
      typeof partial.browserTabNext === 'string' ||
      typeof partial.browserTabSwitchEnabled === 'boolean'
    ) {
      applyGlobalHotkeys()
    }
    if (typeof partial.autoHide === 'boolean') {
      syncAutoHideTracker()
    }
    if (typeof partial.alwaysOnTop === 'boolean') {
      applyAlwaysOnTop(partial.alwaysOnTop)
    }
    if (typeof partial.contentProtection === 'boolean') {
      syncCaptureProtection()
    }
    if (
      typeof partial.windowWidth === 'number' ||
      typeof partial.windowHeight === 'number' ||
      typeof partial.windowSizePreset === 'string'
    ) {
      resizeMainWindow(next.windowWidth, next.windowHeight)
    }
    if (typeof partial.autoLaunch === 'boolean' || typeof partial.closeAction === 'string') {
      syncSystemPreferences()
    }
    if (
      typeof partial.lockEnabled === 'boolean' ||
      typeof partial.lockAutoLockEnabled === 'boolean' ||
      typeof partial.lockAutoLockMinutes === 'number' ||
      typeof partial.lockShortcut === 'string'
    ) {
      syncLockSettings()
    }
    return next
  })

  ipcMain.handle('lock-get-state', () => passwordLockManager.getPublicState())
  ipcMain.handle('lock-set-password', (_event, password: string) => passwordLockManager.setPassword(password))
  ipcMain.handle('lock-reset-password', (_event, currentPassword: string, nextPassword: string) =>
    passwordLockManager.resetPassword(currentPassword, nextPassword)
  )
  ipcMain.handle('lock-unlock', (_event, password: string) => passwordLockManager.unlock(password))
  ipcMain.handle('lock-lock', () => {
    passwordLockManager.lock()
  })
  ipcMain.handle('lock-preview', () => {
    passwordLockManager.previewEffect()
  })
  ipcMain.on('lock-activity', () => {
    passwordLockManager.touchActivity()
  })

  ipcMain.handle('toggle-always-on-top', () => {
    const next = !settings.alwaysOnTop
    saveSettings({ alwaysOnTop: next })
    applyAlwaysOnTop(next)
    return next
  })

  ipcMain.handle('set-window-opacity', (_event, opacity: number) => {
    applyWindowOpacity(opacity)
    saveSettings({ windowOpacity: opacity })
  })

  ipcMain.handle('set-content-opacity', (_event, opacity: number) => {
    saveSettings({ contentOpacity: opacity })
    mainWindow?.webContents.send('content-opacity-changed', opacity)
  })

  ipcMain.handle('can-register-hotkey', (_event, accelerator: string) =>
    canRegisterGlobalShortcut(accelerator)
  )

  ipcMain.handle('toggle-visibility', () => {
    if (!mainWindow) return false
    if (autoHideTracker?.isUserVisible() ?? mainWindow.isVisible()) {
      autoHideTracker?.notifyBossKeyHide()
      mainWindow.hide()
      return false
    }
    autoHideTracker?.notifyBossKeyShow()
    mainWindow.show()
    mainWindow.focus()
    return true
  })

  ipcMain.on('open-external', (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (!mainWindow) return
    toggleWindowMaximize(mainWindow)
  })
  ipcMain.on('window-close', () => handleWindowCloseRequest())

  ipcMain.on(
    'browser-toolbar-state',
    (_event, state: { browsing: boolean; autoHide: boolean; hidden: boolean }) => {
      browserToolbarRevealTracker?.setState(state)
    }
  )
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.local.stealth-reader')
  }

  registerBookProtocol()
  setupBrowserViewManager()
  setupIpc()
  createWindow()
  setupAutoHideTracker()
  applyGlobalHotkeys()
  syncSystemPreferences()
  syncLockSettings()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  appIsQuitting = true
  disposeGlobalHotkeys()
  disposeTray()
  browserViewManager?.dispose()
  browserToolbarRevealTracker?.dispose()
  autoHideTracker?.dispose()
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return
  if (settings.closeAction === 'minimize') return
  app.quit()
})
