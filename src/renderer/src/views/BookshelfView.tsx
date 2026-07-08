import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { AppSettings, BookProgress, BookRecord } from '../../../preload/types'
import BookReader from '../components/BookReader'
import BookList from '../components/shelf/BookList'
import { importBooksFlow } from '../booksImport'
import type { ReaderTocApi } from '../types/toc'

interface BookshelfViewProps {
  settings: AppSettings
  refreshKey: number
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onStatusChange: (status: string) => void
  onImmersiveChange: (immersive: boolean) => void
}

export default function BookshelfView({
  settings,
  refreshKey,
  onSettingsChange,
  onStatusChange,
  onImmersiveChange
}: BookshelfViewProps): JSX.Element {
  const [books, setBooks] = useState<BookRecord[]>([])
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [tocApi, setTocApi] = useState<ReaderTocApi | null>(null)

  const refreshBooks = useCallback(async (): Promise<BookRecord[]> => {
    const next = await window.stealth.listBooks('default')
    setBooks(next)
    return next
  }, [])

  useEffect(() => {
    void refreshBooks().then((next) => {
      onStatusChange(next.length > 0 ? `${next.length} 本书` : '书架为空')
    })
  }, [onStatusChange, refreshBooks, refreshKey])

  useEffect(() => {
    onImmersiveChange(reading)
  }, [reading, onImmersiveChange])

  const reload = useCallback(async (): Promise<void> => {
    await refreshBooks()
  }, [refreshBooks])

  const importBooks = async (): Promise<void> => {
    onStatusChange('导入中')
    const message = await importBooksFlow()
    await reload()
    onStatusChange(message)
  }

  const openBook = async (bookId: string): Promise<void> => {
    await window.stealth.markBookOpened(bookId)
    setActiveBookId(bookId)
    onSettingsChange({ lastBookId: bookId })
    setReading(true)
    onStatusChange('阅读中')
    void reload()
  }

  const removeBook = async (bookId: string): Promise<void> => {
    await window.stealth.removeBook(bookId)
    if (settings.lastBookId === bookId) {
      onSettingsChange({ lastBookId: null })
    }
    if (activeBookId === bookId) {
      setActiveBookId(null)
      setReading(false)
    }
    const next = await refreshBooks()
    onStatusChange(next.length > 0 ? `${next.length} 本书` : '书架为空')
  }

  const saveProgress = async (progress: BookProgress): Promise<void> => {
    if (!activeBookId) return
    const updated = await window.stealth.saveBookProgress(activeBookId, progress)
    setBooks((prev) => prev.map((book) => (book.id === updated.id ? updated : book)))
  }

  const activeBook = books.find((book) => book.id === activeBookId)

  if (reading && activeBookId) {
    return (
      <div className="page page--reader">
        <div className="page-toolbar">
          <div className="page-toolbar__main">
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setReading(false)
                onStatusChange(`${books.length} 本书`)
                void reload()
              }}
              aria-label="返回书架"
            >
              ←
            </button>
            <span className="page-toolbar__title">{activeBook?.title ?? '阅读中'}</span>
            {tocApi?.hasToc ? (
              <button
                type="button"
                className="icon-btn icon-btn--ghost page-toolbar__toc"
                onClick={() => tocApi.openToc()}
                aria-label="目录"
                title="目录"
              >
                <List size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
            {activeBook?.format !== 'pdf' ? (
              <label className="slider-field slider-field--inline">
                <span>{settings.readerFontSize}px</span>
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={settings.readerFontSize}
                  onChange={(event) => onSettingsChange({ readerFontSize: Number(event.target.value) })}
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className="reader-viewport">
          <BookReader
            key={activeBookId}
            bookId={activeBookId}
            fontSize={settings.readerFontSize}
            epubFontColor={settings.epubFontColor}
            epubLineHeight={settings.epubLineHeight}
            contentOpacity={settings.contentOpacity}
            ghostMode={settings.ghostMode}
            readerPrevPage={settings.readerPrevPage}
            readerNextPage={settings.readerNextPage}
            onProgressChange={(progress) => void saveProgress(progress)}
            onTocApiChange={setTocApi}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page page--bookshelf">
      <div className="shelf-card">
        <div className="shelf-header">
          <h2>书架 ({books.length} 本)</h2>
          <div className="shelf-view-toggle" role="radiogroup" aria-label="书架展示方式">
            <button
              type="button"
              role="radio"
              aria-checked={settings.shelfViewMode === 'list'}
              className={
                settings.shelfViewMode === 'list'
                  ? 'shelf-view-toggle__btn shelf-view-toggle__btn--active'
                  : 'shelf-view-toggle__btn'
              }
              onClick={() => onSettingsChange({ shelfViewMode: 'list' })}
              aria-label="列表展示"
              title="列表展示"
            >
              <List size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.shelfViewMode === 'cover'}
              className={
                settings.shelfViewMode === 'cover'
                  ? 'shelf-view-toggle__btn shelf-view-toggle__btn--active'
                  : 'shelf-view-toggle__btn'
              }
              onClick={() => onSettingsChange({ shelfViewMode: 'cover' })}
              aria-label="封面展示"
              title="封面展示"
            >
              <LayoutGrid size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="shelf-main__body">
          <BookList
            books={books}
            lastBookId={settings.lastBookId}
            viewMode={settings.shelfViewMode ?? 'list'}
            onOpen={(bookId) => void openBook(bookId)}
            onRemove={(bookId) => void removeBook(bookId)}
            onImport={() => void importBooks()}
          />
        </div>
      </div>
    </div>
  )
}
