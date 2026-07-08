import type { BookRecord } from '../../../../preload/types'
import BookListItem from './BookListItem'

interface BookListProps {
  books: BookRecord[]
  lastBookId: string | null
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
  onImport: () => void
}

export default function BookList({
  books,
  lastBookId,
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

  return (
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
