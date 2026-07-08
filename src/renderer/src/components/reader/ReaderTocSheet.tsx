import { X } from 'lucide-react'
import type { TocItem } from '../../types/toc'

interface ReaderTocSheetProps {
  open: boolean
  items: TocItem[]
  onClose: () => void
  onSelect: (item: TocItem) => void
}

function TocList({
  items,
  depth,
  onSelect
}: {
  items: TocItem[]
  depth: number
  onSelect: (item: TocItem) => void
}): JSX.Element {
  return (
    <ul className="reader-toc-sheet__list" role="list">
      {items.map((item) => (
        <li key={item.id} className="reader-toc-sheet__item">
          <button
            type="button"
            className="reader-toc-sheet__link"
            style={{ paddingLeft: `${12 + depth * 14}px` }}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </button>
          {item.subitems?.length ? (
            <TocList items={item.subitems} depth={depth + 1} onSelect={onSelect} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default function ReaderTocSheet({
  open,
  items,
  onClose,
  onSelect
}: ReaderTocSheetProps): JSX.Element {
  const handleSelect = (item: TocItem): void => {
    onSelect(item)
    onClose()
  }

  return (
    <div className={open ? 'reader-toc-sheet reader-toc-sheet--open' : 'reader-toc-sheet'} aria-hidden={!open}>
      <button type="button" className="reader-toc-sheet__backdrop" onClick={onClose} aria-label="关闭目录" tabIndex={open ? 0 : -1} />

      <aside className="reader-toc-sheet__panel" role="dialog" aria-modal="true" aria-label="目录">
        <header className="reader-toc-sheet__header">
          <h2 className="reader-toc-sheet__title">目录</h2>
          <button type="button" className="icon-btn icon-btn--ghost" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className="reader-toc-sheet__body">
          {items.length === 0 ? (
            <p className="reader-toc-sheet__empty">暂无目录</p>
          ) : (
            <TocList items={items} depth={0} onSelect={handleSelect} />
          )}
        </div>
      </aside>
    </div>
  )
}
