import type { BookRecord } from '../../../../preload/types'
import { coverGradientForTitle, formatLabel, formatProgress } from '../../lib/cover'

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
        <div
          className="book-list__cover"
          style={{ background: coverGradientForTitle(book.title) }}
          aria-hidden="true"
        >
          <span className={`book-list__format book-list__format--${book.format}`}>
            {formatLabel(book.format)}
          </span>
        </div>
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
