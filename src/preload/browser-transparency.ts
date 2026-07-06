import { applyTransparency, refreshTransparency, removeTransparency } from './transparency/engine'

const { ipcRenderer } = require('electron') as typeof import('electron')

let transparencyRequested = false

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
  if (transparencyRequested) {
    refreshTransparency()
    scheduleRefreshRetries()
  }
})

window.addEventListener('load', () => {
  if (transparencyRequested) {
    refreshTransparency()
    scheduleRefreshRetries()
  }
})
