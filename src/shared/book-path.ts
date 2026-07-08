import { join } from 'path'

export function isSafeStoredBookName(storedName: string): boolean {
  if (!storedName) return false
  if (storedName.includes('..')) return false
  if (storedName.includes('/') || storedName.includes('\\')) return false
  return true
}

export function resolveStoredBookPath(booksDir: string, storedName: string): string | null {
  if (!isSafeStoredBookName(storedName)) return null
  return join(booksDir, storedName)
}
