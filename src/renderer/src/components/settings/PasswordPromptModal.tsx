import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface PasswordPromptModalProps {
  open: boolean
  title: string
  description?: string
  requireCurrent?: boolean
  onClose: () => void
  onSubmit: (payload: { currentPassword?: string; nextPassword: string }) => Promise<{ ok: boolean; message?: string }>
}

export default function PasswordPromptModal({
  open,
  title,
  description,
  requireCurrent = false,
  onClose,
  onSubmit
}: PasswordPromptModalProps): JSX.Element | null {
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setCurrentPassword('')
    setNextPassword('')
    setConfirmPassword('')
    setError('')
    setSubmitting(false)
  }, [open])

  if (!open) return null

  const handleSubmit = async (): Promise<void> => {
    if (nextPassword.trim().length < 4) {
      setError('密码至少 4 位')
      return
    }
    if (nextPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      currentPassword: requireCurrent ? currentPassword : undefined,
      nextPassword
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message ?? '保存失败')
      return
    }

    onClose()
  }

  return (
    <div className="prompt-modal" role="presentation">
      <button type="button" className="prompt-modal__backdrop" onClick={onClose} aria-label="关闭" />
      <div className="prompt-modal__panel" role="dialog" aria-modal="true">
        <button type="button" className="prompt-modal__close" onClick={onClose} aria-label="关闭">
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <h3 className="prompt-modal__title">{title}</h3>
        {description ? <p className="prompt-modal__desc">{description}</p> : null}

        <div className="prompt-modal__fields">
          {requireCurrent ? (
            <label className="prompt-modal__field">
              <span>当前密码</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoFocus
              />
            </label>
          ) : null}
          <label className="prompt-modal__field">
            <span>{requireCurrent ? '新密码' : '密码'}</span>
            <input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              autoFocus={!requireCurrent}
            />
          </label>
          <label className="prompt-modal__field">
            <span>确认密码</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="prompt-modal__error">{error}</p> : null}

        <button type="button" className="prompt-modal__submit" disabled={submitting} onClick={() => void handleSubmit()}>
          确定
        </button>
      </div>
    </div>
  )
}
