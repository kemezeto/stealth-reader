import type { AppSettings } from '../../../../preload/types'

export type BrowserZoomScope = 'domain' | 'global'

export const BROWSER_ZOOM_MIN = 25
export const BROWSER_ZOOM_MAX = 300
export const BROWSER_ZOOM_DEFAULT = 100

export function clampBrowserZoomPercent(value: number): number {
  return Math.min(BROWSER_ZOOM_MAX, Math.max(BROWSER_ZOOM_MIN, Math.round(value)))
}

export function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function resolveBrowserZoomPercent(settings: AppSettings, url: string): number {
  const fallback = settings.browserZoomPercent ?? BROWSER_ZOOM_DEFAULT

  if ((settings.browserZoomScope ?? 'domain') === 'global') {
    return clampBrowserZoomPercent(fallback)
  }

  const domain = getDomainFromUrl(url)
  if (!domain) return clampBrowserZoomPercent(fallback)

  const byDomain = settings.browserZoomByDomain ?? {}
  const domainZoom = byDomain[domain]
  return clampBrowserZoomPercent(domainZoom ?? fallback)
}

export function persistBrowserZoomChange(
  settings: AppSettings,
  url: string,
  percent: number
): Partial<AppSettings> {
  const nextPercent = clampBrowserZoomPercent(percent)

  if ((settings.browserZoomScope ?? 'domain') === 'global') {
    return { browserZoomPercent: nextPercent }
  }

  const domain = getDomainFromUrl(url)
  if (!domain) {
    return { browserZoomPercent: nextPercent }
  }

  return {
    browserZoomByDomain: {
      ...(settings.browserZoomByDomain ?? {}),
      [domain]: nextPercent
    }
  }
}
