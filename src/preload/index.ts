import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, AutoHideStatePayload, BookProgress, ShelfId, StealthApi } from './types'

const stealth: StealthApi = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (partial) => ipcRenderer.invoke('save-settings', partial),
  setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
  setContentOpacity: (opacity) => ipcRenderer.invoke('set-content-opacity', opacity),
  toggleVisibility: () => ipcRenderer.invoke('toggle-visibility'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onContentOpacityChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, opacity: number) => callback(opacity)
    ipcRenderer.on('content-opacity-changed', listener)
    return () => ipcRenderer.removeListener('content-opacity-changed', listener)
  },
  onAutoHideStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AutoHideStatePayload) =>
      callback(payload)
    ipcRenderer.on('auto-hide:state', listener)
    return () => ipcRenderer.removeListener('auto-hide:state', listener)
  },
  onWindowResized: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('window-resized', listener)
    return () => ipcRenderer.removeListener('window-resized', listener)
  },
  browserToolbarSetState: (state) => ipcRenderer.send('browser-toolbar-state', state),
  onBrowserToolbarReveal: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('browser-toolbar-reveal', listener)
    return () => ipcRenderer.removeListener('browser-toolbar-reveal', listener)
  },
  browserMount: (options) => ipcRenderer.invoke('browser-mount', options),
  browserUnmount: () => ipcRenderer.invoke('browser-unmount'),
  browserSetBounds: (bounds) => ipcRenderer.send('browser-set-bounds', bounds),
  browserNavigate: (url) => ipcRenderer.invoke('browser-navigate', url),
  browserBack: () => ipcRenderer.invoke('browser-back'),
  browserForward: () => ipcRenderer.invoke('browser-forward'),
  browserReload: () => ipcRenderer.invoke('browser-reload'),
  browserSetTransparency: (transparent, opacity) =>
    ipcRenderer.send('browser-set-transparency', { transparent, opacity }),
  browserSetScrollbar: (show) => ipcRenderer.send('browser-set-scrollbar', show),
  browserSetZoom: (factor) => ipcRenderer.send('browser-set-zoom', factor),
  onBrowserZoomChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, percent: number) => callback(percent)
    ipcRenderer.on('browser-zoom-changed', listener)
    return () => ipcRenderer.removeListener('browser-zoom-changed', listener)
  },
  onBrowserEvent: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: import('./types').BrowserEventPayload) =>
      callback(payload)
    ipcRenderer.on('browser-event', listener)
    return () => ipcRenderer.removeListener('browser-event', listener)
  },
  onBrowserTabSwitch: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, direction: 'prev' | 'next') => callback(direction)
    ipcRenderer.on('browser-tab-switch', listener)
    return () => ipcRenderer.removeListener('browser-tab-switch', listener)
  },
  canRegisterHotkey: (accelerator) => ipcRenderer.invoke('can-register-hotkey', accelerator),
  getLockState: () => ipcRenderer.invoke('lock-get-state'),
  setLockPassword: (password) => ipcRenderer.invoke('lock-set-password', password),
  resetLockPassword: (currentPassword, nextPassword) =>
    ipcRenderer.invoke('lock-reset-password', currentPassword, nextPassword),
  unlockApp: (password) => ipcRenderer.invoke('lock-unlock', password),
  lockApp: () => ipcRenderer.invoke('lock-lock'),
  previewLockEffect: () => ipcRenderer.invoke('lock-preview'),
  notifyLockActivity: () => ipcRenderer.send('lock-activity'),
  onLockStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: import('./types').LockPublicState) =>
      callback(state)
    ipcRenderer.on('lock-state-changed', listener)
    return () => ipcRenderer.removeListener('lock-state-changed', listener)
  },
  getBrowserCacheSize: () => ipcRenderer.invoke('browser-cache-size'),
  clearBrowserCache: () => ipcRenderer.invoke('browser-clear-cache'),
  getWebviewPreloadPath: () => ipcRenderer.invoke('get-webview-preload-path'),
  listShelves: () => ipcRenderer.invoke('books-list-shelves'),
  listBooks: (shelfId?: ShelfId) => ipcRenderer.invoke('books-list', shelfId),
  importBooks: () => ipcRenderer.invoke('books-import'),
  markBookOpened: (bookId) => ipcRenderer.invoke('books-mark-opened', bookId),
  getBookMeta: (bookId) => ipcRenderer.invoke('books-get-meta', bookId),
  getBookBytes: (bookId) => ipcRenderer.invoke('books-get-bytes', bookId),
  getBookContent: (bookId) => ipcRenderer.invoke('books-get-content', bookId),
  saveBookProgress: (bookId, progress: BookProgress) =>
    ipcRenderer.invoke('books-save-progress', bookId, progress),
  removeBook: (bookId) => ipcRenderer.invoke('books-remove', bookId)
}

contextBridge.exposeInMainWorld('stealth', stealth)
