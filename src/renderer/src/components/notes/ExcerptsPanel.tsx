import { useCallback, useEffect, useState } from 'react'
import type { BookExcerpt, ExcerptBookSummary } from '../../../../preload/types'
import BookCover from '../shelf/BookCover'

function formatExcerptTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ExcerptsPanel(): JSX.Element {
  const [books, setBooks] = useState<ExcerptBookSummary[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedBookTitle, setSelectedBookTitle] = useState('')
  const [excerpts, setExcerpts] = useState<BookExcerpt[]>([])
  const [loading, setLoading] = useState(true)

  const refreshBooks = useCallback(async (): Promise<void> => {
    const next = await window.stealth.listExcerptBooks()
    setBooks(next)
  }, [])

  const refreshExcerpts = useCallback(async (bookId: string): Promise<void> => {
    const next = await window.stealth.listExcerpts(bookId)
    setExcerpts(next)
  }, [])

  useEffect(() => {
    setLoading(true)
    void refreshBooks().finally(() => setLoading(false))
  }, [refreshBooks])

  useEffect(() => {
    if (!selectedBookId) {
      setExcerpts([])
      return
    }
    void refreshExcerpts(selectedBookId)
  }, [refreshExcerpts, selectedBookId])

  const openBook = (book: ExcerptBookSummary): void => {
    setSelectedBookId(book.bookId)
    setSelectedBookTitle(book.bookTitle)
  }

  const backToBooks = (): void => {
    setSelectedBookId(null)
    setSelectedBookTitle('')
    void refreshBooks()
  }

  const removeExcerpt = async (excerptId: string): Promise<void> => {
    await window.stealth.removeExcerpt(excerptId)
    if (selectedBookId) {
      await refreshExcerpts(selectedBookId)
      await refreshBooks()
      if (excerpts.length <= 1) {
        backToBooks()
      }
    }
  }

  if (loading && books.length === 0 && !selectedBookId) {
    return <div className="notes-panel__state">正在加载摘抄…</div>
  }

  if (selectedBookId) {
    return (
      <div className="notes-panel notes-panel--detail">
        <div className="notes-panel__toolbar">
          <button type="button" className="notes-panel__back" onClick={backToBooks}>
            ← 返回
          </button>
          <h3 className="notes-panel__heading">{selectedBookTitle}</h3>
          <span className="notes-panel__count">{excerpts.length} 条摘抄</span>
        </div>

        {excerpts.length === 0 ? (
          <div className="notes-panel__state">这本书还没有摘抄</div>
        ) : (
          <ul className="excerpt-list">
            {excerpts.map((excerpt) => (
              <li key={excerpt.id} className="excerpt-list__item">
                <blockquote className="excerpt-list__quote">{excerpt.text}</blockquote>
                <div className="excerpt-list__meta">
                  <time dateTime={new Date(excerpt.createdAt).toISOString()}>{formatExcerptTime(excerpt.createdAt)}</time>
                  <button
                    type="button"
                    className="excerpt-list__remove"
                    aria-label="删除摘抄"
                    onClick={() => void removeExcerpt(excerpt.id)}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="notes-panel__empty">
        <p>还没有摘抄</p>
        <span>在 EPUB 阅读器中选中文字，右键即可保存到摘抄</span>
      </div>
    )
  }

  return (
    <div className="notes-panel">
      <ul className="excerpt-book-list">
        {books.map((book) => (
          <li key={book.bookId} className="excerpt-book-list__item">
            <button type="button" className="excerpt-book-list__open" onClick={() => openBook(book)}>
              <BookCover format="epub" variant="grid" />
              <div className="excerpt-book-list__meta">
                <span className="excerpt-book-list__title">{book.bookTitle}</span>
                <span className="excerpt-book-list__count">{book.count} 条摘抄</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
