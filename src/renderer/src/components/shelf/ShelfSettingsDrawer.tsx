import { X } from 'lucide-react'
import type { AppSettings } from '../../../preload/types'

const EPUB_LINE_HEIGHT_OPTIONS = [1.5, 2, 2.5, 3] as const

function normalizeLineHeight(value: number | undefined): number {
  const current = value ?? 2
  return EPUB_LINE_HEIGHT_OPTIONS.reduce((closest, option) =>
    Math.abs(option - current) < Math.abs(closest - current) ? option : closest
  )
}

interface ShelfSettingsDrawerProps {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

export default function ShelfSettingsDrawer({
  open,
  settings,
  onClose,
  onSettingsChange
}: ShelfSettingsDrawerProps): JSX.Element {
  const lineHeight = normalizeLineHeight(settings.epubLineHeight)

  return (
    <div className={open ? 'shelf-drawer shelf-drawer--open' : 'shelf-drawer'} aria-hidden={!open}>
      <button type="button" className="shelf-drawer__backdrop" onClick={onClose} aria-label="关闭书架设置" tabIndex={open ? 0 : -1} />

      <aside className="shelf-drawer__panel" role="dialog" aria-modal="true" aria-label="书架设置">
        <header className="shelf-drawer__header">
          <h2 className="shelf-drawer__title">书架设置</h2>
          <button type="button" className="icon-btn icon-btn--ghost" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className="shelf-drawer__body">
          <section className="shelf-drawer__section">
            <h3>EPUB 阅读</h3>
            <label className="shelf-drawer__row">
              <span>字体颜色</span>
              <div className="shelf-drawer__color-control">
                <input
                  type="color"
                  value={settings.epubFontColor}
                  onChange={(event) => onSettingsChange({ epubFontColor: event.target.value })}
                  aria-label="EPUB 字体颜色"
                />
                <code>{settings.epubFontColor}</code>
              </div>
            </label>
            <div className="shelf-drawer__row">
              <span>行间距</span>
              <div className="shelf-drawer__line-height-options" role="radiogroup" aria-label="EPUB 行间距">
                {EPUB_LINE_HEIGHT_OPTIONS.map((option) => {
                  const active = lineHeight === option

                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={
                        active
                          ? 'shelf-drawer__line-height-option shelf-drawer__line-height-option--active'
                          : 'shelf-drawer__line-height-option'
                      }
                      onClick={() => onSettingsChange({ epubLineHeight: option })}
                    >
                      {option.toFixed(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
