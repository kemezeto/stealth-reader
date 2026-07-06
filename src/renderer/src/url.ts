import { resolveNavigationInput, type SearchEngine } from '../../shared/search-engine'

function normalizeUrl(input: string, searchEngine: SearchEngine = 'bing'): string {
  return resolveNavigationInput(input, searchEngine)
}

export { normalizeUrl, resolveNavigationInput }
export type { SearchEngine }
