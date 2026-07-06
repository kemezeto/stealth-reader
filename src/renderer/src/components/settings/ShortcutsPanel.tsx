import { useState } from 'react'
import { Crown, Pencil } from 'lucide-react'
import type { AppSettings } from '../../../../preload/types'
import { formatHotkeyDisplay } from '../../../../shared/hotkeys'
import HotkeyEditorModal from './HotkeyEditorModal'

type HotkeyField =
  | 'readerPrevPage'
  | 'readerNextPage'
  | 'bossKey1'
  | 'bossKey2'
  | 'browserTabPrev'
  | 'browserTabNext'

interface ShortcutRowProps {
  title: string
  description: string
  value: string
  onEdit: () => void
}

function ShortcutRow({ title, description, value, onEdit }: ShortcutRowProps): JSX.Element {
  return (
    <div className="shortcuts-row">
      <div className="shortcuts-row__info">
        <strong className="shortcuts-row__title">{title}</strong>
        <span className="shortcuts-row__desc">{description}</span>
      </div>
      <div className="shortcuts-row__actions">
        <span className="shortcuts-row__key">{formatHotkeyDisplay(value)}</span>
        <button type="button" className="shortcuts-row__edit" onClick={onEdit} aria-label={`编辑 ${title}`}>
          <Pencil size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

interface ShortcutsPanelProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

export default function ShortcutsPanel({ settings, onSettingsChange }: ShortcutsPanelProps): JSX.Element {
  const [editingField, setEditingField] = useState<HotkeyField | null>(null)

  const currentEditingValue = editingField ? settings[editingField] : ''

  const handleSave = (accelerator: string): void => {
    if (!editingField) return
    onSettingsChange({ [editingField]: accelerator })
  }

  return (
    <div className="shortcuts-panel">
      <section className="shortcuts-section">
        <header className="shortcuts-section__header">
          <h3 className="shortcuts-section__title">阅读翻页快捷键</h3>
        </header>
        <ShortcutRow
          title="上一页"
          description="阅读界面返回上一页"
          value={settings.readerPrevPage}
          onEdit={() => setEditingField('readerPrevPage')}
        />
        <ShortcutRow
          title="下一页"
          description="阅读界面前往下一页"
          value={settings.readerNextPage}
          onEdit={() => setEditingField('readerNextPage')}
        />
      </section>

      <section className="shortcuts-section">
        <header className="shortcuts-section__header">
          <h3 className="shortcuts-section__title">
            老板键
            <Crown className="shortcuts-section__badge" size={14} strokeWidth={2} aria-hidden="true" />
          </h3>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.bossKeyEnabled}
              onChange={(event) => onSettingsChange({ bossKeyEnabled: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </header>
        <ShortcutRow
          title="老板键 1"
          description="一键隐藏/恢复"
          value={settings.bossKey1}
          onEdit={() => setEditingField('bossKey1')}
        />
        <ShortcutRow
          title="老板键 2"
          description="一键退出后台"
          value={settings.bossKey2}
          onEdit={() => setEditingField('bossKey2')}
        />
      </section>

      <section className="shortcuts-section">
        <header className="shortcuts-section__header">
          <h3 className="shortcuts-section__title">
            网页标签切换
            <Crown className="shortcuts-section__badge" size={14} strokeWidth={2} aria-hidden="true" />
          </h3>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.browserTabSwitchEnabled}
              onChange={(event) => onSettingsChange({ browserTabSwitchEnabled: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </header>
        <ShortcutRow
          title="往前"
          description="切换到前一个网页标签"
          value={settings.browserTabPrev}
          onEdit={() => setEditingField('browserTabPrev')}
        />
        <ShortcutRow
          title="往后"
          description="切换到后一个网页标签"
          value={settings.browserTabNext}
          onEdit={() => setEditingField('browserTabNext')}
        />
      </section>

      <HotkeyEditorModal
        open={editingField !== null}
        currentValue={currentEditingValue}
        onClose={() => setEditingField(null)}
        onSave={handleSave}
      />
    </div>
  )
}
