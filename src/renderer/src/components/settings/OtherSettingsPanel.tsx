import type { AppSettings, CloseAction } from '../../../../preload/types'

interface OtherSettingsPanelProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

const CLOSE_ACTION_OPTIONS: Array<{
  id: CloseAction
  label: string
  description: string
}> = [
  {
    id: 'minimize',
    label: '最小化',
    description: '关闭窗口时最小化到托盘，软件继续在后台运行'
  },
  {
    id: 'quit',
    label: '退出软件',
    description: '关闭窗口时直接退出软件并结束后台运行'
  }
]

export default function OtherSettingsPanel({
  settings,
  onSettingsChange
}: OtherSettingsPanelProps): JSX.Element {
  return (
    <div className="other-settings-panel">
      <section className="other-settings-section">
        <header className="other-settings-section__header">
          <span className="other-settings-section__mark" aria-hidden="true" />
          <div>
            <h3 className="other-settings-section__title">系统与常规</h3>
            <p className="other-settings-section__desc">管理软件启动、关闭等系统行为偏好</p>
          </div>
        </header>

        <div className="other-settings-toggle-card">
          <div className="other-settings-toggle-card__info">
            <strong>开机自动启动</strong>
            <span>登录系统时自动开启软件</span>
          </div>
          <label className="toggle toggle--light">
            <input
              type="checkbox"
              checked={settings.autoLaunch}
              onChange={(event) => onSettingsChange({ autoLaunch: event.target.checked })}
            />
            <span className="toggle__track" aria-hidden="true" />
          </label>
        </div>

        <div className="other-settings-group">
          <h4 className="other-settings-group__title">关闭按钮行为</h4>
          <div className="other-settings-options" role="radiogroup" aria-label="关闭按钮行为">
            {CLOSE_ACTION_OPTIONS.map((option) => {
              const active = settings.closeAction === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={
                    active ? 'other-settings-option other-settings-option--active' : 'other-settings-option'
                  }
                  onClick={() => onSettingsChange({ closeAction: option.id })}
                >
                  <span className="other-settings-option__radio" aria-hidden="true">
                    <span className="other-settings-option__dot" />
                  </span>
                  <span className="other-settings-option__content">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
