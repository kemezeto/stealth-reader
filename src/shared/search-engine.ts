export type SearchEngine = 'bing' | 'baidu' | 'google'

export const SEARCH_ENGINE_OPTIONS: Array<{ id: SearchEngine; label: string }> = [
  { id: 'bing', label: '必应' },
  { id: 'baidu', label: '百度' },
  { id: 'google', label: 'Google' }
]

const SEARCH_URL_BUILDERS: Record<SearchEngine, (query: string) => string> = {
  bing: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  baidu: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
  google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

function isLikelyUrl(input: string): boolean {
  if (/^https?:\/\//i.test(input)) return true
  if (/\s/.test(input)) return false

  if (/^localhost(?::\d+)?(?:\/.*)?$/i.test(input)) return true
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/.*)?$/.test(input)) return true

  return /^[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:\/.*)?$/.test(input)
}

export function resolveNavigationInput(input: string, searchEngine: SearchEngine): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  if (isLikelyUrl(trimmed)) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  return SEARCH_URL_BUILDERS[searchEngine](trimmed)
}
