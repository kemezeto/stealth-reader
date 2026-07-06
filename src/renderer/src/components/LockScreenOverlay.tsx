import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { AppSettings, LockPublicState } from '../../../preload/types'

interface LockScreenOverlayProps {
  settings: AppSettings
  lockState: LockPublicState
  onUnlocked: () => void
}

export default function LockScreenOverlay({
  settings,
  lockState,
  onUnlocked
}: LockScreenOverlayProps): JSX.Element | null {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!lockState.locked) return null

  const theme = settings.lockScreenTheme
  const isPreview = lockState.preview

  const handleUnlock = async (): Promise<void> => {
    if (isPreview) {
      onUnlocked()
      return
    }

    const result = await window.stealth.unlockApp(password)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setPassword('')
    setError('')
    onUnlocked()
  }

  return (
    <div className={`lock-screen lock-screen--${theme}${isPreview ? ' lock-screen--preview' : ''}`}>
      <div className="lock-screen__panel">
        <div className="lock-screen__icon" aria-hidden="true">
          <Lock size={28} strokeWidth={1.8} />
        </div>
        {settings.lockDisplayName ? <h2 className="lock-screen__name">{settings.lockDisplayName}</h2> : null}
        <p className="lock-screen__title">{isPreview ? '锁定效果预览' : '界面已锁定'}</p>
        {!isPreview ? (
          <>
            <input
              className="lock-screen__input"
              type="password"
              value={password}
              placeholder="请输入密码"
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleUnlock()
              }}
              autoFocus
            />
            {error ? <p className="lock-screen__error">{error}</p> : null}
            <button type="button" className="lock-screen__submit" onClick={() => void handleUnlock()}>
              解锁
            </button>
          </>
        ) : (
          <p className="lock-screen__hint">预览将在几秒后自动关闭</p>
        )}
      </div>
    </div>
  )
}
