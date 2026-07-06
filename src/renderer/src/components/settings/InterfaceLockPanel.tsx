import { useEffect, useState } from 'react'
import { Crown, Eye, Keyboard, Lock, Pencil } from 'lucide-react'
import type { AppSettings, LockPublicState, LockScreenTheme } from '../../../../preload/types'
import { formatHotkeyDisplay } from '../../../../shared/hotkeys'
import HotkeyEditorModal from './HotkeyEditorModal'
import PasswordPromptModal from './PasswordPromptModal'
import SimplePromptModal from './SimplePromptModal'

interface InterfaceLockPanelProps {
  settings: AppSettings
  lockState: LockPublicState
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onRefreshLockState: () => void
}

export default function InterfaceLockPanel({
  settings,
  lockState,
  onSettingsChange,
  onRefreshLockState
}: InterfaceLockPanelProps): JSX.Element {
  const [passwordModal, setPasswordModal] = useState<'set' | 'reset' | null>(null)
  const [minutesModalOpen, setMinutesModalOpen] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false)

  const disabled = !settings.lockEnabled

  const handleEnableToggle = (checked: boolean): void => {
    if (checked && !lockState.hasPassword) {
      setPasswordModal('set')
      return
    }
    onSettingsChange({ lockEnabled: checked })
  }

  const handlePasswordSaved = async (): Promise<void> => {
    onRefreshLockState()
    if (!settings.lockEnabled) {
      onSettingsChange({ lockEnabled: true })
    }
  }

  return (
    <div className="interface-lock-panel">
      <header className="interface-lock-panel__header">
        <div className="interface-lock-panel__title-wrap">
          <Lock size={18} strokeWidth={2} aria-hidden="true" />
          <h3>界面锁定</h3>
          <span className="interface-lock-panel__badge">
            <Crown size={12} strokeWidth={2} aria-hidden="true" />
            会员功能
          </span>
        </div>
        <button type="button" className="interface-lock-panel__preview" onClick={() => void window.stealth.previewLockEffect()}>
          <Eye size={14} strokeWidth={2} aria-hidden="true" />
          预览锁定效果
        </button>
      </header>

      <div className="interface-lock-panel__list">
        <div className={`interface-lock-row${disabled ? ' interface-lock-row--disabled' : ''}`}>
          <span>打开界面锁定</span>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.lockEnabled}
              onChange={(event) => handleEnableToggle(event.target.checked)}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </div>

        <button
          type="button"
          className={`interface-lock-row interface-lock-row--action${disabled ? ' interface-lock-row--disabled' : ''}`}
          disabled={disabled}
          onClick={() => setPasswordModal('reset')}
        >
          <span>重置密码</span>
          <span className="interface-lock-row__action">
            <Pencil size={14} strokeWidth={2} aria-hidden="true" />
            重置密码
          </span>
        </button>

        <div className={`interface-lock-row${disabled ? ' interface-lock-row--disabled' : ''}`}>
          <span>开启自动锁定</span>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.lockAutoLockEnabled}
              disabled={disabled}
              onChange={(event) => onSettingsChange({ lockAutoLockEnabled: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </div>

        <button
          type="button"
          className={`interface-lock-row interface-lock-row--stacked interface-lock-row--action${
            disabled || !settings.lockAutoLockEnabled ? ' interface-lock-row--disabled' : ''
          }`}
          disabled={disabled || !settings.lockAutoLockEnabled}
          onClick={() => setMinutesModalOpen(true)}
        >
          <span className="interface-lock-row__stack">
            <strong>自动锁定时间</strong>
            <small>无操作后，{settings.lockAutoLockMinutes} 分钟后自动锁定，需密码解锁</small>
          </span>
          <span className="interface-lock-row__action">
            <Pencil size={14} strokeWidth={2} aria-hidden="true" />
            {settings.lockAutoLockMinutes} 分钟
          </span>
        </button>

        <button
          type="button"
          className={`interface-lock-row interface-lock-row--action${disabled ? ' interface-lock-row--disabled' : ''}`}
          disabled={disabled}
          onClick={() => setShortcutModalOpen(true)}
        >
          <span>锁定快捷键</span>
          <span className="interface-lock-row__action interface-lock-row__action--wide">
            <span className="interface-lock-row__key">{formatHotkeyDisplay(settings.lockShortcut)}</span>
            <Keyboard size={14} strokeWidth={2} aria-hidden="true" />
            修改
          </span>
        </button>

        <div className={`interface-lock-row interface-lock-row--stacked${disabled ? ' interface-lock-row--disabled' : ''}`}>
          <span className="interface-lock-row__stack">
            <strong>主页显示锁定按钮</strong>
            <small>开启后，主页左上角显示锁定按钮</small>
          </span>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.lockShowHomeButton}
              disabled={disabled}
              onChange={(event) => onSettingsChange({ lockShowHomeButton: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </div>

        <button
          type="button"
          className={`interface-lock-row interface-lock-row--action${disabled ? ' interface-lock-row--disabled' : ''}`}
          disabled={disabled}
          onClick={() => setNameModalOpen(true)}
        >
          <span>显示名称</span>
          <span className="interface-lock-row__action">
            <Pencil size={14} strokeWidth={2} aria-hidden="true" />
            {settings.lockDisplayName.trim() || '无'}
          </span>
        </button>

        <div className={`interface-lock-row interface-lock-row--theme${disabled ? ' interface-lock-row--disabled' : ''}`}>
          <span>锁定后遮罩颜色</span>
          <div className="interface-lock-theme-options" role="radiogroup" aria-label="锁定后遮罩颜色">
            {(['dark', 'light'] as LockScreenTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                role="radio"
                aria-checked={settings.lockScreenTheme === theme}
                disabled={disabled}
                className={
                  settings.lockScreenTheme === theme
                    ? 'interface-lock-theme-option interface-lock-theme-option--active'
                    : 'interface-lock-theme-option'
                }
                onClick={() => onSettingsChange({ lockScreenTheme: theme })}
              >
                <span className="interface-lock-theme-option__radio" aria-hidden="true">
                  <span />
                </span>
                {theme === 'dark' ? '深色' : '浅色'}
              </button>
            ))}
          </div>
        </div>

        <div className={`interface-lock-row${disabled ? ' interface-lock-row--disabled' : ''}`}>
          <span>自动翻页时不锁定</span>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.lockSkipDuringAutoPaging}
              disabled={disabled}
              onChange={(event) => onSettingsChange({ lockSkipDuringAutoPaging: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </div>
      </div>

      {!lockState.hasPassword && settings.lockEnabled ? (
        <p className="interface-lock-panel__hint">请先设置密码后，界面锁定才会生效。</p>
      ) : null}

      <PasswordPromptModal
        open={passwordModal === 'set'}
        title="设置锁定密码"
        description="设置后可用于解锁界面锁定"
        onClose={() => setPasswordModal(null)}
        onSubmit={async ({ nextPassword }) => {
          const result = await window.stealth.setLockPassword(nextPassword)
          if (result.ok) await handlePasswordSaved()
          return { ok: result.ok, message: result.ok ? undefined : result.message }
        }}
      />

      <PasswordPromptModal
        open={passwordModal === 'reset'}
        title="重置密码"
        requireCurrent={lockState.hasPassword}
        onClose={() => setPasswordModal(null)}
        onSubmit={async ({ currentPassword, nextPassword }) => {
          const result = lockState.hasPassword
            ? await window.stealth.resetLockPassword(currentPassword ?? '', nextPassword)
            : await window.stealth.setLockPassword(nextPassword)
          if (result.ok) onRefreshLockState()
          return { ok: result.ok, message: result.ok ? undefined : result.message }
        }}
      />

      <SimplePromptModal
        open={minutesModalOpen}
        title="自动锁定时间"
        label="分钟"
        initialValue={String(settings.lockAutoLockMinutes)}
        inputType="number"
        min={1}
        max={240}
        onClose={() => setMinutesModalOpen(false)}
        onSubmit={(value) => {
          const minutes = Math.min(240, Math.max(1, Number.parseInt(value, 10) || 30))
          onSettingsChange({ lockAutoLockMinutes: minutes })
        }}
      />

      <SimplePromptModal
        open={nameModalOpen}
        title="显示名称"
        label="锁屏显示名称"
        initialValue={settings.lockDisplayName}
        onClose={() => setNameModalOpen(false)}
        onSubmit={(value) => onSettingsChange({ lockDisplayName: value.trim() })}
      />

      <HotkeyEditorModal
        open={shortcutModalOpen}
        currentValue={settings.lockShortcut}
        onClose={() => setShortcutModalOpen(false)}
        onSave={(accelerator) => onSettingsChange({ lockShortcut: accelerator })}
      />
    </div>
  )
}
