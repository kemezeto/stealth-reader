export type BookFormat = 'txt' | 'epub' | 'pdf'
export type ShelfId = 'default'

export interface BookProgress {
  scrollTop: number
  percent: number
  location?: string
  page?: number
}

export interface BookRecord {
  id: string
  title: string
  format: BookFormat
  shelfId: ShelfId
  storedName: string
  importedAt: number
  lastOpenedAt: number
  progress: BookProgress
}

export interface BooksLibrary {
  books: BookRecord[]
}

export interface BookContent {
  id: string
  title: string
  format: 'txt'
  text: string
  encoding: string
  progress: BookProgress
}

export interface BookMeta {
  id: string
  title: string
  format: BookFormat
  progress: BookProgress
  fileUrl: string
}

export interface ShelfInfo {
  id: ShelfId
  label: string
  count: number
}
