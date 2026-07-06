import { ipcMain, type BrowserWindow } from 'electron'
import {
  getBookContent,
  getBookBytes,
  getBookMeta,
  importBooksFromDialog,
  listBooks,
  listShelves,
  markBookOpened,
  removeBook,
  saveBookProgress
} from './store'
import type { BookProgress, ShelfId } from './types'

export function registerBooksIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('books-list-shelves', () => listShelves())

  ipcMain.handle('books-list', (_event, shelfId?: ShelfId) => listBooks(shelfId))

  ipcMain.handle('books-import', async () => importBooksFromDialog(getWindow()))

  ipcMain.handle('books-mark-opened', (_event, bookId: string) => markBookOpened(bookId))

  ipcMain.handle('books-get-content', (_event, bookId: string) => getBookContent(bookId))

  ipcMain.handle('books-get-meta', (_event, bookId: string) => getBookMeta(bookId))

  ipcMain.handle('books-get-bytes', (_event, bookId: string) => getBookBytes(bookId))

  ipcMain.handle('books-save-progress', (_event, bookId: string, progress: BookProgress) =>
    saveBookProgress(bookId, progress)
  )

  ipcMain.handle('books-remove', (_event, bookId: string) => {
    removeBook(bookId)
  })
}
