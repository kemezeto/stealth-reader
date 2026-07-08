import type { BookFormat } from '../../../../preload/types'
import { formatLabel } from '../../lib/cover'

interface BookCoverProps {
  format: BookFormat
  variant?: 'list' | 'grid'
}

export default function BookCover({ format, variant = 'list' }: BookCoverProps): JSX.Element {
  return (
    <div
      className={`book-cover book-cover--${format} book-cover--${variant}`}
      aria-hidden="true"
    >
      <span className="book-cover__format">{formatLabel(format)}</span>
    </div>
  )
}
