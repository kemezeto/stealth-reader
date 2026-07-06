import { useEffect, useMemo, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { eventToAccelerator, eventToDisplayParts, splitHotkeyParts } from '../../../../shared/hotkeys'

interface HotkeyEditorModalProps {
  open: boolean
  currentValue: string
  onClose: () => void
  onSave: (accelerator: string) => void
}

function HotkeyKeyChips({ parts, waiting }: { parts: string[]; waiting: boolean }): JSX.Element {
  const displayParts = parts.length > 0 ? parts : ['?']

  return (
    <div className={`hotkey-modal__keys${waiting ? ' hotkey-modal__keys--waiting' : ''}`}>
      {displayParts.map((part, index) => (
        <span key={`${part}-${index}`} className="hotkey-modal__key-group">
          {index > 0 ? (
            <span className="hotkey-modal__key-plus" aria-hidden="true">
              +
            </span>
          ) : null}
          <span className="hotkey-modal__key-chip">{part}</span>
        </span>
      ))}
    </div>
  )
}

export default function HotkeyEditorModal({
  open,
  currentValue,
  onClose,
  onSave
}: HotkeyEditorModalProps): JSX.Element | null {
  const [liveParts, setLiveParts] = useState<string[]>([])
  const [waiting, setWaiting] = useState(true)

  const baseParts = useMemo(() => splitHotkeyParts(currentValue), [currentValue])
  const displayParts = liveParts.length > 0 ? liveParts : baseParts

  useEffect(() => {
    if (!open) return
    setLiveParts([])
    setWaiting(true)
  }, [open, currentValue])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        onClose()
        return
      }

      const partialParts = eventToDisplayParts(event)
      if (partialParts.length > 0) {
        setLiveParts(partialParts)
        setWaiting(true)
      }

      const accelerator = eventToAccelerator(event)
      if (!accelerator) return

      setLiveParts(splitHotkeyParts(accelerator))
      setWaiting(false)
      onSave(accelerator)
      onClose()
    }

    const onKeyUp = (event: KeyboardEvent): void => {
      const partialParts = eventToDisplayParts(event)
      setLiveParts(partialParts)
      setWaiting(partialParts.length === 0)
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [open, onClose, onSave])

  if (!open) return null

  return (
    <div className="hotkey-modal" role="presentation">
      <button type="button" className="hotkey-modal__backdrop" onClick={onClose} aria-label="关闭" />
      <div className="hotkey-modal__panel" role="dialog" aria-modal="true" aria-labelledby="hotkey-modal-title">
        <button type="button" className="hotkey-modal__close" onClick={onClose} aria-label="关闭">
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="hotkey-modal__icon" aria-hidden="true">
          <Keyboard size={22} strokeWidth={1.8} />
        </div>

        <h3 id="hotkey-modal-title" className="hotkey-modal__title">
          设置快捷键
        </h3>
        <p className="hotkey-modal__desc">按下任意单键或组合键，保存后立即生效</p>

        <div className="hotkey-modal__capture">
          <HotkeyKeyChips parts={displayParts} waiting={waiting} />
          <p className="hotkey-modal__waiting">{waiting ? '等待输入…' : ''}</p>
        </div>

        <p className="hotkey-modal__hint">
          按下 <kbd>ESC</kbd> 取消设置
        </p>

        <button type="button" className="hotkey-modal__cancel" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  )
}
