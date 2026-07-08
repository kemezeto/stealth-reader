const ALLOWED_BROWSER_PROTOCOLS = new Set(['http:', 'https:'])

export function isAllowedBrowserUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    return ALLOWED_BROWSER_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

export function assertAllowedBrowserUrl(url: string): string {
  const trimmed = url.trim()
  if (!isAllowedBrowserUrl(trimmed)) {
    throw new Error('仅允许 http / https 网址')
  }
  return trimmed
}
