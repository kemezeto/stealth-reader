import type { BookRecord, ShelfViewMode } from '../../../../preload/types'
import BookCoverCard from './BookCoverCard'
import BookListItem from './BookListItem'

interface BookListProps {
  books: BookRecord[]
  lastBookId: string | null
  viewMode: ShelfViewMode
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
  onImport: () => void
}

export default function BookList({
  books,
  lastBookId,
  viewMode,
  onOpen,
  onRemove,
  onImport
}: BookListProps): JSX.Element {
  if (books.length === 0) {
    return (
      <div className="shelf-empty">
        <div className="shelf-empty__cover" aria-hidden="true" />
        <p>这个书架还没有书</p>
        <button type="button" className="btn btn--outline" onClick={onImport}>
          上传 TXT / EPUB / PDF
        </button>
      </div>
    )
  }

  return viewMode === 'cover' ? (
    <ul className="book-grid">
      {books.map((book) => (
        <BookCoverCard
          key={book.id}
          book={book}
          isRecent={book.id === lastBookId}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </ul>
  ) : (
    <ul className="book-list">
      {books.map((book) => (
        <BookListItem
          key={book.id}
          book={book}
          isRecent={book.id === lastBookId}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
