import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SimplePromptModalProps {
  open: boolean
  title: string
  label: string
  initialValue: string
  suffix?: string
  inputType?: 'text' | 'number'
  min?: number
  max?: number
  onClose: () => void
  onSubmit: (value: string) => void
}

export default function SimplePromptModal({
  open,
  title,
  label,
  initialValue,
  suffix,
  inputType = 'text',
  min,
  max,
  onClose,
  onSubmit
}: SimplePromptModalProps): JSX.Element | null {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [initialValue, open])

  if (!open) return null

  return (
    <div className="prompt-modal" role="presentation">
      <button type="button" className="prompt-modal__backdrop" onClick={onClose} aria-label="关闭" />
      <div className="prompt-modal__panel" role="dialog" aria-modal="true">
        <button type="button" className="prompt-modal__close" onClick={onClose} aria-label="关闭">
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <h3 className="prompt-modal__title">{title}</h3>
        <label className="prompt-modal__field">
          <span>{label}</span>
          <input
            type={inputType}
            min={min}
            max={max}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
        </label>
        <button
          type="button"
          className="prompt-modal__submit"
          onClick={() => {
            onSubmit(value)
            onClose()
          }}
        >
          确定{suffix ? ` (${suffix})` : ''}
        </button>
      </div>
    </div>
  )
}
