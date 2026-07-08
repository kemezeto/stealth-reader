export type ActiveTab = 'home' | 'bookshelf' | 'settings'

export type BookFormat = 'txt' | 'epub' | 'pdf'
export type ShelfId = 'default'

export interface BookProgress {
  scrollTop: number
  percent: number
  location?: string
  page?: number
}

export interface BookRecord {
  id: string
  title: string
  format: BookFormat
  shelfId: ShelfId
  storedName: string
  importedAt: number
  lastOpenedAt: number
  progress: BookProgress
}

export interface ShelfInfo {
  id: ShelfId
  label: string
  count: number
}

export interface ImportBooksResult {
  imported: BookRecord[]
  skipped: number
  unsupported: number
  duplicate: number
}

export interface BookContent {
  id: string
  title: string
  format: 'txt'
  text: string
  encoding: string
  progress: BookProgress
}

export interface BookMeta {
  id: string
  title: string
  format: BookFormat
  progress: BookProgress
  fileUrl: string
}

export type WindowSizePreset = 'portrait' | 'landscape' | 'custom'

export type SearchEngine = 'bing' | 'baidu' | 'google'

export type CloseAction = 'minimize' | 'quit'

export type LockScreenTheme = 'dark' | 'light'

export interface LockPublicState {
  locked: boolean
  preview: boolean
  hasPassword: boolean
}

export interface BrowserBookmark {
  id: string
  title: string
  url: string
  createdAt: number
}

export interface BrowserHistoryEntry {
  id: string
  title: string
  url: string
  visitedAt: number
}

export interface AppSettings {
  windowOpacity: number
  contentOpacity: number
  autoHide: boolean
  alwaysOnTop: boolean
  ghostMode: boolean
  contentProtection: boolean
  transparentMode: boolean
  activeTab: ActiveTab
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
  browserBookmarks: BrowserBookmark[]
  browserHistory: BrowserHistoryEntry[]
  windowWidth: number
  windowHeight: number
  windowSizePreset: WindowSizePreset
  searchEngine: SearchEngine
  autoLaunch: boolean
  closeAction: CloseAction
  lockEnabled: boolean
  lockAutoLockEnabled: boolean
  lockAutoLockMinutes: number
  lockShortcut: string
  lockShowHomeButton: boolean
  lockDisplayName: string
  lockScreenTheme: LockScreenTheme
  lockSkipDuringAutoPaging: boolean
  /** @deprecated use bossKey1 */
  bossKey?: string
  lastUrl: string
}

export interface AutoHideStatePayload {
  hidden: boolean
}

export interface BrowserBounds {
  x: number
  y: number
  width: number
  height: number
}

export type BrowserEventPayload =
  | { type: 'loading'; loading: boolean }
  | { type: 'navigate'; url: string; canGoBack: boolean; canGoForward: boolean }
  | { type: 'fail-load'; errorDescription: string }
  | { type: 'ready' }
  | { type: 'sync-bounds' }

export interface StealthApi {
  getSettings: () => Promise<AppSettings>
  saveSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>
  setWindowOpacity: (opacity: number) => Promise<void>
  setContentOpacity: (opacity: number) => Promise<void>
  toggleVisibility: () => Promise<boolean>
  toggleAlwaysOnTop: () => Promise<boolean>
  minimize: () => void
  maximize: () => void
  close: () => void
  onContentOpacityChanged: (callback: (opacity: number) => void) => () => void
  onAutoHideStateChanged: (callback: (payload: AutoHideStatePayload) => void) => () => void
  onWindowResized: (callback: () => void) => () => void
  browserToolbarSetState: (state: {
    browsing: boolean
    autoHide: boolean
    hidden: boolean
  }) => void
  onBrowserToolbarReveal: (callback: () => void) => () => void
  browserMount: (options: {
    url: string
    bounds: BrowserBounds
    transparent: boolean
    opacity: number
    showScrollbar: boolean
    zoomFactor: number
  }) => Promise<void>
  browserUnmount: () => Promise<void>
  browserSetBounds: (bounds: BrowserBounds) => void
  browserNavigate: (url: string) => Promise<void>
  browserBack: () => Promise<boolean>
  browserForward: () => Promise<boolean>
  browserReload: () => Promise<void>
  browserSetTransparency: (transparent: boolean, opacity: number) => void
  browserSetScrollbar: (show: boolean) => void
  browserSetZoom: (factor: number) => void
  onBrowserZoomChanged: (callback: (percent: number) => void) => () => void
  onBrowserEvent: (callback: (payload: BrowserEventPayload) => void) => () => void
  onBrowserTabSwitch: (callback: (direction: 'prev' | 'next') => void) => () => void
  canRegisterHotkey: (accelerator: string) => Promise<boolean>
  getLockState: () => Promise<LockPublicState>
  setLockPassword: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  resetLockPassword: (
    currentPassword: string,
    nextPassword: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  unlockApp: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  lockApp: () => Promise<void>
  previewLockEffect: () => Promise<void>
  notifyLockActivity: () => void
  onLockStateChanged: (callback: (state: LockPublicState) => void) => () => void
  getWebviewPreloadPath: () => Promise<string>
  listShelves: () => Promise<ShelfInfo[]>
  listBooks: (shelfId?: ShelfId) => Promise<BookRecord[]>
  importBooks: () => Promise<ImportBooksResult>
  markBookOpened: (bookId: string) => Promise<BookRecord>
  getBookMeta: (bookId: string) => Promise<BookMeta>
  getBookBytes: (bookId: string) => Promise<ArrayBuffer>
  getBookContent: (bookId: string) => Promise<BookContent>
  saveBookProgress: (bookId: string, progress: BookProgress) => Promise<BookRecord>
  removeBook: (bookId: string) => Promise<void>
}

declare global {
  interface Window {
    stealth: StealthApi
  }
}

export {}
