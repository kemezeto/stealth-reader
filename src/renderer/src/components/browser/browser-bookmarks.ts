import type { BrowserBookmark } from '../../../../preload/types'

export function normalizeBookmarkUrl(url: string): string {
  if (!url || url === 'about:blank') return ''

  try {
    const parsed = new URL(url)
    parsed.hash = ''
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

export function titleFromBookmarkUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (!parsed.pathname || parsed.pathname === '/') return host
    return `${host}${parsed.pathname}`
  } catch {
    return url
  }
}

export function isBookmarked(bookmarks: BrowserBookmark[], url: string): boolean {
  const normalized = normalizeBookmarkUrl(url)
  if (!normalized) return false
  return bookmarks.some((item) => normalizeBookmarkUrl(item.url) === normalized)
}

export function addBrowserBookmark(
  bookmarks: BrowserBookmark[],
  url: string,
  title?: string
): BrowserBookmark[] {
  const normalized = normalizeBookmarkUrl(url)
  if (!normalized || isBookmarked(bookmarks, normalized)) {
    return bookmarks
  }

  return [
    {
      id: crypto.randomUUID(),
      title: title?.trim() || titleFromBookmarkUrl(normalized),
      url: normalized,
      createdAt: Date.now()
    },
    ...bookmarks
  ]
}

export function removeBrowserBookmark(bookmarks: BrowserBookmark[], id: string): BrowserBookmark[] {
  return bookmarks.filter((item) => item.id !== id)
}

export function removeBrowserBookmarkByUrl(bookmarks: BrowserBookmark[], url: string): BrowserBookmark[] {
  const normalized = normalizeBookmarkUrl(url)
  if (!normalized) return bookmarks
  return bookmarks.filter((item) => normalizeBookmarkUrl(item.url) !== normalized)
}

export function formatBookmarkSubtitle(url: string): string {
  try {
    const parsed = new URL(url)
    const path = `${parsed.pathname}${parsed.search}`
    return path || '/'
  } catch {
    return url
  }
}
