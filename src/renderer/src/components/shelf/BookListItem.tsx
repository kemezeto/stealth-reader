import type { BookRecord } from '../../../../preload/types'
import { formatProgress } from '../../lib/cover'
import BookCover from './BookCover'

interface BookListItemProps {
  book: BookRecord
  isRecent: boolean
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
}

export default function BookListItem({
  book,
  isRecent,
  onOpen,
  onRemove
}: BookListItemProps): JSX.Element {
  const progressText = formatProgress(book.progress.percent)

  return (
    <li className={`book-list__item${isRecent ? ' book-list__item--recent' : ''}`}>
      <button type="button" className="book-list__open" onClick={() => onOpen(book.id)}>
        <BookCover format={book.format} variant="list" />
        <div className="book-list__meta">
          <span className="book-list__title">{book.title}</span>
          {progressText ? <span className="book-list__progress">已读 {progressText}</span> : null}
        </div>
      </button>
      <button
        type="button"
        className="book-list__remove"
        aria-label={`删除 ${book.title}`}
        onClick={() => onRemove(book.id)}
      >
        ×
      </button>
    </li>
  )
}
