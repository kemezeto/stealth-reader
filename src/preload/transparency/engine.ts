import {
  buildTransparencyCss,
  getCriticalSelectors,
  isWereadReaderPage
} from './engine-css'
import { isWereadHost } from './sites/weread'

const STYLE_ID = '__stealth_transparency__'
const STABLE_ALPHA = 'rgba(255, 255, 255, 0.01)'

let transparencyEnabled = false
let mutationObserver: MutationObserver | null = null
let themeObserver: MutationObserver | null = null
let routeObserverInstalled = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastUrl = location.href

function whenDocumentReady(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true })
    return
  }
  fn()
}

function criticalSelectors(): string[] {
  return getCriticalSelectors(location.hostname)
}

function getCriticalElementBackground(element: Element): string {
  return element === document.documentElement ? STABLE_ALPHA : 'transparent'
}

function applyTransparencyToElement(element: HTMLElement): void {
  const background = getCriticalElementBackground(element)
  element.style.setProperty('background-color', background, 'important')
  element.style.setProperty('background-image', 'none', 'important')
  element.style.setProperty('background', background, 'important')
}

function removeTransparencyFromElement(element: HTMLElement): void {
  element.style.removeProperty('background-color')
  element.style.removeProperty('background-image')
  element.style.removeProperty('background')
}

function applyTransparencyToCriticalElements(): void {
  for (const selector of criticalSelectors()) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) {
      applyTransparencyToElement(element)
    }
  }
}

function ensureStyleElement(): void {
  const css = buildTransparencyCss(location.hostname)
  let style = document.getElementById(STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    ;(document.head || document.documentElement).appendChild(style)
  }
  style.textContent = css
}

function removeStyleElement(): void {
  document.getElementById(STYLE_ID)?.remove()
}

function reapplyDebounced(): void {
  if (!transparencyEnabled) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    applyTransparencyToCriticalElements()
    debounceTimer = null
  }, 100)
}

function startMutationObserver(): void {
  if (mutationObserver) return

  mutationObserver = new MutationObserver((records) => {
    if (!transparencyEnabled) return

    const selectors = criticalSelectors()
    let needsReapply = false

    for (const record of records) {
      if (
        record.type === 'attributes' &&
        (record.attributeName === 'style' || record.attributeName === 'class')
      ) {
        const target = record.target
        if (target instanceof HTMLElement && selectors.some((s) => target.matches?.(s))) {
          needsReapply = true
          break
        }
      }

      if (record.type === 'childList' && record.addedNodes.length > 0) {
        let sawReaderLayer = false
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (selectors.some((s) => node.matches?.(s))) {
            applyTransparencyToElement(node)
          }
          if (
            node.matches?.('.readerContent, .renderTargetContainer, .wr_readerBackground_opacity') ||
            node.querySelector?.('.readerContent, .renderTargetContainer, .wr_readerBackground_opacity')
          ) {
            sawReaderLayer = true
          }
        })
        if (sawReaderLayer) {
          ensureStyleElement()
          reapplyDebounced()
        }
      }
    }

    if (needsReapply) reapplyDebounced()
  })

  mutationObserver.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['style', 'class']
  })
}

function stopMutationObserver(): void {
  mutationObserver?.disconnect()
  mutationObserver = null
}

function startThemeObserver(): void {
  if (themeObserver) return

  themeObserver = new MutationObserver((records) => {
    if (!transparencyEnabled) return
    const themeChanged = records.some(
      (record) =>
        record.attributeName === 'class' ||
        record.attributeName === 'dark' ||
        record.attributeName === 'data-theme' ||
        record.attributeName === 'theme'
    )
    if (themeChanged) {
      setTimeout(() => applyTransparencyToCriticalElements(), 50)
    }
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'dark', 'data-theme', 'theme', 'style']
  })
}

function stopThemeObserver(): void {
  themeObserver?.disconnect()
  themeObserver = null
}

function scheduleWereadReaderRetries(): void {
  if (!isWereadHost(location.hostname) || !isWereadReaderPage(location.pathname)) return
  for (const delay of [300, 800, 1500, 3000]) {
    setTimeout(() => {
      if (!transparencyEnabled) return
      ensureStyleElement()
      applyTransparencyToCriticalElements()
    }, delay)
  }
}

function onRouteChange(): void {
  const href = location.href
  if (href === lastUrl) return
  lastUrl = href
  setTimeout(() => {
    if (!transparencyEnabled) return
    ensureStyleElement()
    applyTransparencyToCriticalElements()
    scheduleWereadReaderRetries()
  }, 300)
}

function startRouteObserver(): void {
  if (routeObserverInstalled) return
  routeObserverInstalled = true

  window.addEventListener('popstate', onRouteChange)

  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = (...args) => {
    originalPushState(...args)
    onRouteChange()
  }

  history.replaceState = (...args) => {
    originalReplaceState(...args)
    onRouteChange()
  }
}

export function applyTransparency(): void {
  whenDocumentReady(() => {
    transparencyEnabled = true
    lastUrl = location.href
    ensureStyleElement()
    applyTransparencyToCriticalElements()
    startMutationObserver()
    startThemeObserver()
    startRouteObserver()
    scheduleWereadReaderRetries()
  })
}

export function removeTransparency(): void {
  whenDocumentReady(() => {
    transparencyEnabled = false
    removeStyleElement()

    for (const selector of criticalSelectors()) {
      const element = document.querySelector(selector)
      if (element instanceof HTMLElement) {
        removeTransparencyFromElement(element)
      }
    }

    stopMutationObserver()
    stopThemeObserver()

    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })
}

export function refreshTransparency(): void {
  if (!transparencyEnabled) return
  ensureStyleElement()
  applyTransparencyToCriticalElements()
}
