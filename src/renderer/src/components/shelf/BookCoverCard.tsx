import type { BookRecord } from '../../../../preload/types'
import { formatProgress } from '../../lib/cover'
import BookCover from './BookCover'

interface BookCoverCardProps {
  book: BookRecord
  isRecent: boolean
  onOpen: (bookId: string) => void
  onRemove: (bookId: string) => void
}

export default function BookCoverCard({
  book,
  isRecent,
  onOpen,
  onRemove
}: BookCoverCardProps): JSX.Element {
  const progressText = formatProgress(book.progress.percent)

  return (
    <li className={`book-grid__item${isRecent ? ' book-grid__item--recent' : ''}`}>
      <button type="button" className="book-grid__open" onClick={() => onOpen(book.id)}>
        <BookCover format={book.format} variant="grid" />
        <span className="book-grid__title">{book.title}</span>
        {progressText ? <span className="book-grid__progress">已读 {progressText}</span> : null}
      </button>
      <button
        type="button"
        className="book-grid__remove"
        aria-label={`删除 ${book.title}`}
        onClick={() => onRemove(book.id)}
      >
        ×
      </button>
    </li>
  )
}
