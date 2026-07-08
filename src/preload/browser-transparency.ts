import { applyTransparency, refreshTransparency, removeTransparency } from './transparency/engine'

const { ipcRenderer } = require('electron') as typeof import('electron')

let transparencyRequested = false

function ensureMobileViewport(): void {
  const existing = document.querySelector('meta[name="viewport"]')
  const content = 'width=device-width, initial-scale=1, viewport-fit=cover'

  if (existing instanceof HTMLMetaElement) {
    if (!/width\s*=/.test(existing.content)) {
      existing.content = content
    }
    return
  }

  const meta = document.createElement('meta')
  meta.name = 'viewport'
  meta.content = content
  document.head.appendChild(meta)
}

function scheduleRefreshRetries(): void {
  for (const delay of [0, 300, 800, 1500]) {
    setTimeout(() => {
      if (transparencyRequested) refreshTransparency()
    }, delay)
  }
}

ipcRenderer.on('content-transparency', (_event, enabled: boolean) => {
  transparencyRequested = enabled
  if (enabled) {
    applyTransparency()
    scheduleRefreshRetries()
  } else {
    removeTransparency()
  }
})

ipcRenderer.on('content-opacity', (_event, opacity: number) => {
  const value = Math.max(0, Math.min(100, opacity)) / 100
  document.documentElement.style.opacity = String(value)
})

ipcRenderer.on('content-transparency-refresh', () => {
  refreshTransparency()
})

window.addEventListener('DOMContentLoaded', () => {
  ensureMobileViewport()
  if (transparencyRequested) {
    refreshTransparency()
    scheduleRefreshRetries()
  }
})

window.addEventListener('load', () => {
  ensureMobileViewport()
  if (transparencyRequested) {
    refreshTransparency()
    scheduleRefreshRetries()
  }
})
