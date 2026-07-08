import { app, dialog, type OpenDialogOptions } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { randomUUID } from 'crypto'
import { resolveStoredBookPath, isSafeStoredBookName } from '../../shared/book-path'
import { readTxtFile } from './txt-reader'
import type {
  BookContent,
  BookFormat,
  BookMeta,
  BookProgress,
  BookRecord,
  BooksLibrary,
  ShelfId,
  ShelfInfo
} from './types'

export const PDF_MAX_BYTES = 60 * 1024 * 1024
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.epub', '.pdf'])
const DEFAULT_SHELF: ShelfId = 'default'

function libraryPath(): string {
  return join(app.getPath('userData'), 'books.json')
}

function booksDir(): string {
  return join(app.getPath('userData'), 'books')
}

function formatFromExtension(ext: string): BookFormat | null {
  switch (ext) {
    case '.txt':
      return 'txt'
    case '.epub':
      return 'epub'
    case '.pdf':
      return 'pdf'
    default:
      return null
  }
}

function inferFormat(raw: Partial<BookRecord> & { storedName: string }): BookFormat {
  if (raw.format) return raw.format
  return formatFromExtension(extname(raw.storedName).toLowerCase()) ?? 'txt'
}

function normalizeProgress(raw?: BookProgress): BookProgress {
  return {
    scrollTop: raw?.scrollTop ?? 0,
    percent: raw?.percent ?? 0,
    location: raw?.location,
    page: raw?.page
  }
}

function normalizeBook(raw: Partial<BookRecord> & { id: string; title: string; storedName: string }): BookRecord {
  const importedAt = raw.importedAt ?? Date.now()
  const storedName = isSafeStoredBookName(raw.storedName) ? raw.storedName : `${raw.id}${extname(raw.storedName).toLowerCase() || '.txt'}`
  return {
    id: raw.id,
    title: raw.title,
    format: inferFormat({ ...raw, storedName }),
    shelfId: raw.shelfId ?? DEFAULT_SHELF,
    storedName,
    importedAt,
    lastOpenedAt: raw.lastOpenedAt ?? importedAt,
    progress: normalizeProgress(raw.progress)
  }
}

function loadLibrary(): BooksLibrary {
  try {
    const raw = readFileSync(libraryPath(), 'utf-8')
    const parsed = JSON.parse(raw) as BooksLibrary
    const books = Array.isArray(parsed.books) ? parsed.books.map((book) => normalizeBook(book)) : []
    return { books }
  } catch {
    return { books: [] }
  }
}

function saveLibrary(library: BooksLibrary): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(libraryPath(), JSON.stringify(library, null, 2), 'utf-8')
}

function titleFromPath(filePath: string): string {
  return basename(filePath, extname(filePath))
}

function storedFilePath(storedName: string): string {
  const filePath = resolveStoredBookPath(booksDir(), storedName)
  if (!filePath) {
    throw new Error('无效的书籍文件路径')
  }
  return filePath
}

function sortBooks(books: BookRecord[]): BookRecord[] {
  return [...books].sort((a, b) => {
    if (b.lastOpenedAt !== a.lastOpenedAt) {
      return b.lastOpenedAt - a.lastOpenedAt
    }
    return b.importedAt - a.importedAt
  })
}

function findBook(bookId: string): BookRecord {
  const library = loadLibrary()
  const book = library.books.find((item) => item.id === bookId)
  if (!book) {
    throw new Error('书籍不存在')
  }
  return book
}

export function resolveBookFilePath(bookId: string): string | null {
  const library = loadLibrary()
  const book = library.books.find((item) => item.id === bookId)
  if (!book) return null
  const filePath = storedFilePath(book.storedName)
  return existsSync(filePath) ? filePath : null
}

export function listShelves(): ShelfInfo[] {
  const library = loadLibrary()
  const counts = new Map<ShelfId, number>()
  for (const book of library.books) {
    counts.set(book.shelfId, (counts.get(book.shelfId) ?? 0) + 1)
  }
  return [{ id: 'default', label: '默认', count: counts.get('default') ?? 0 }]
}

export function listBooks(shelfId: ShelfId = DEFAULT_SHELF): BookRecord[] {
  const library = loadLibrary()
  return sortBooks(library.books.filter((book) => book.shelfId === shelfId))
}

export function markBookOpened(bookId: string): BookRecord {
  const library = loadLibrary()
  const index = library.books.findIndex((item) => item.id === bookId)
  if (index < 0) {
    throw new Error('书籍不存在')
  }
  library.books[index] = {
    ...library.books[index],
    lastOpenedAt: Date.now()
  }
  saveLibrary(library)
  return library.books[index]
}

export function getBookBytes(bookId: string): Buffer {
  const filePath = resolveBookFilePath(bookId)
  if (!filePath) {
    throw new Error('书籍不存在')
  }
  return readFileSync(filePath)
}

export function getBookMeta(bookId: string): BookMeta {
  const book = findBook(bookId)
  const filePath = storedFilePath(book.storedName)
  if (!existsSync(filePath)) {
    throw new Error('书籍文件已丢失，请重新导入')
  }

  return {
    id: book.id,
    title: book.title,
    format: book.format,
    progress: book.progress,
    fileUrl: `localbook://${book.id}/`
  }
}

export function getBookContent(bookId: string): BookContent {
  const book = markBookOpened(bookId)
  if (book.format !== 'txt') {
    throw new Error('该格式请使用内置阅读器打开')
  }

  const filePath = storedFilePath(book.storedName)
  if (!existsSync(filePath)) {
    throw new Error('书籍文件已丢失，请重新导入')
  }

  const { text, encoding } = readTxtFile(filePath)
  return {
    id: book.id,
    title: book.title,
    format: 'txt',
    text,
    encoding,
    progress: book.progress
  }
}

export function saveBookProgress(bookId: string, progress: BookProgress): BookRecord {
  const library = loadLibrary()
  const index = library.books.findIndex((item) => item.id === bookId)
  if (index < 0) {
    throw new Error('书籍不存在')
  }

  const previous = library.books[index].progress
  library.books[index] = {
    ...library.books[index],
    progress: {
      scrollTop: progress.scrollTop ?? previous.scrollTop,
      percent: Math.max(0, Math.min(100, progress.percent)),
      location: progress.location !== undefined ? progress.location : previous.location,
      page: progress.page !== undefined ? progress.page : previous.page
    }
  }
  saveLibrary(library)
  return library.books[index]
}

export function removeBook(bookId: string): void {
  const library = loadLibrary()
  const index = library.books.findIndex((item) => item.id === bookId)
  if (index < 0) return

  const [removed] = library.books.splice(index, 1)
  saveLibrary(library)

  const filePath = storedFilePath(removed.storedName)
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

function isDuplicate(library: BooksLibrary, sourcePath: string): boolean {
  const title = titleFromPath(sourcePath)
  let size = 0
  try {
    size = statSync(sourcePath).size
  } catch {
    return false
  }
  return library.books.some((book) => {
    if (book.title !== title) return false
    const storedPath = storedFilePath(book.storedName)
    if (!existsSync(storedPath)) return false
    try {
      return statSync(storedPath).size === size
    } catch {
      return false
    }
  })
}

function importDialogOptions(): OpenDialogOptions {
  const base: OpenDialogOptions = {
    title: '导入书籍 (TXT / EPUB / PDF)',
    properties: ['openFile', 'multiSelections']
  }

  // Windows 多过滤器时容易默认落到「仅 txt」，导致看不到 epub/pdf
  if (process.platform === 'win32') {
    return base
  }

  return {
    ...base,
    filters: [{ name: '电子书', extensions: ['txt', 'epub', 'pdf'] }]
  }
}

export async function importBooksFromDialog(
  browserWindow: Electron.BrowserWindow | null
): Promise<{ imported: BookRecord[]; skipped: number; unsupported: number; duplicate: number }> {
  const dialogOptions = importDialogOptions()
  const result = browserWindow
    ? await dialog.showOpenDialog(browserWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return { imported: [], skipped: 0, unsupported: 0, duplicate: 0 }
  }

  mkdirSync(booksDir(), { recursive: true })
  const library = loadLibrary()
  const imported: BookRecord[] = []
  let unsupported = 0
  let duplicate = 0
  const now = Date.now()

  for (const sourcePath of result.filePaths) {
    const ext = extname(sourcePath).toLowerCase()
    const format = formatFromExtension(ext)
    if (!format || !SUPPORTED_EXTENSIONS.has(ext)) {
      unsupported += 1
      continue
    }

    if (isDuplicate(library, sourcePath)) {
      duplicate += 1
      continue
    }

    if (format === 'pdf') {
      try {
        if (statSync(sourcePath).size > PDF_MAX_BYTES) {
          unsupported += 1
          continue
        }
      } catch {
        unsupported += 1
        continue
      }
    }

    const id = randomUUID()
    const storedName = `${id}${ext}`
    copyFileSync(sourcePath, storedFilePath(storedName))

    const record = normalizeBook({
      id,
      title: titleFromPath(sourcePath),
      format,
      shelfId: DEFAULT_SHELF,
      storedName,
      importedAt: now,
      lastOpenedAt: now,
      progress: { scrollTop: 0, percent: 0 }
    })
    library.books.push(record)
    imported.push(record)
  }

  if (imported.length > 0) {
    saveLibrary(library)
  }

  const skipped = unsupported + duplicate
  return { imported, skipped, unsupported, duplicate }
}
