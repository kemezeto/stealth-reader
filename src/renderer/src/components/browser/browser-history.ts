import type { BrowserHistoryEntry } from '../../../../preload/types'
import { formatBookmarkSubtitle, normalizeBookmarkUrl, titleFromBookmarkUrl } from './browser-bookmarks'

export const BROWSER_HISTORY_MAX = 100

export function addBrowserHistoryEntry(
  history: BrowserHistoryEntry[],
  url: string,
  title?: string
): BrowserHistoryEntry[] {
  const normalized = normalizeBookmarkUrl(url)
  if (!normalized) return history

  const withoutDuplicate = history.filter(
    (item) => normalizeBookmarkUrl(item.url) !== normalized
  )

  const next: BrowserHistoryEntry[] = [
    {
      id: crypto.randomUUID(),
      title: title?.trim() || titleFromBookmarkUrl(normalized),
      url: normalized,
      visitedAt: Date.now()
    },
    ...withoutDuplicate
  ]

  return next.slice(0, BROWSER_HISTORY_MAX)
}

export function removeBrowserHistoryEntry(
  history: BrowserHistoryEntry[],
  id: string
): BrowserHistoryEntry[] {
  return history.filter((item) => item.id !== id)
}

export function clearBrowserHistory(): BrowserHistoryEntry[] {
  return []
}

export function formatHistorySubtitle(url: string): string {
  return formatBookmarkSubtitle(url)
}

export function formatHistoryTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
