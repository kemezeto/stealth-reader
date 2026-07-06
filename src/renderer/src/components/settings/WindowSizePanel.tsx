import { useEffect, useMemo, useState } from 'react'
import type { AppSettings, WindowSizePreset } from '../../../../preload/types'
import {
  WINDOW_SIZE_PRESETS,
  validateWindowSize
} from '../../../../shared/window-size'

interface WindowSizePanelProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

function PresetIcon({ landscape }: { landscape?: boolean }): JSX.Element {
  return (
    <span
      className={landscape ? 'window-size-card__icon window-size-card__icon--landscape' : 'window-size-card__icon'}
      aria-hidden="true"
    />
  )
}

export default function WindowSizePanel({
  settings,
  onSettingsChange
}: WindowSizePanelProps): JSX.Element {
  const [customWidth, setCustomWidth] = useState(String(settings.windowWidth))
  const [customHeight, setCustomHeight] = useState(String(settings.windowHeight))
  const [error, setError] = useState('')

  useEffect(() => {
    setCustomWidth(String(settings.windowWidth))
    setCustomHeight(String(settings.windowHeight))
  }, [settings.windowWidth, settings.windowHeight])

  const previewSize = useMemo(() => {
    const width = Number.parseInt(customWidth, 10) || settings.windowWidth
    const height = Number.parseInt(customHeight, 10) || settings.windowHeight
    const max = 88
    const ratio = width / Math.max(height, 1)

    if (ratio >= 1) {
      return { width: max, height: Math.max(28, max / ratio) }
    }

    return { width: Math.max(28, max * ratio), height: max }
  }, [customHeight, customWidth, settings.windowHeight, settings.windowWidth])

  const applyPreset = (preset: Exclude<WindowSizePreset, 'custom'>): void => {
    const size = WINDOW_SIZE_PRESETS[preset]
    setError('')
    onSettingsChange({
      windowWidth: size.width,
      windowHeight: size.height,
      windowSizePreset: preset
    })
  }

  const applyCustom = (): void => {
    const width = Number.parseInt(customWidth.trim(), 10)
    const height = Number.parseInt(customHeight.trim(), 10)
    const result = validateWindowSize(width, height)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setError('')
    onSettingsChange({
      windowWidth: width,
      windowHeight: height,
      windowSizePreset: 'custom'
    })
  }

  return (
    <div className="window-size-panel">
      <div className="window-size-presets">
        {(['portrait', 'landscape'] as const).map((preset) => {
          const size = WINDOW_SIZE_PRESETS[preset]
          const active = settings.windowSizePreset === preset

          return (
            <button
              key={preset}
              type="button"
              className={active ? 'window-size-card window-size-card--active' : 'window-size-card'}
              onClick={() => applyPreset(preset)}
            >
              {active ? <span className="window-size-card__badge">当前</span> : null}
              <PresetIcon landscape={preset === 'landscape'} />
              <strong className="window-size-card__title">
                {preset === 'portrait' ? '纵向模式' : '横向模式'}
              </strong>
              <span className="window-size-card__size">
                {size.width} x {size.height}
              </span>
            </button>
          )
        })}
      </div>

      <section className="window-size-custom">
        <h3 className="window-size-custom__title">自定义尺寸</h3>

        <div className="window-size-custom__body">
          <div className="window-size-custom__inputs">
            <label className="window-size-field">
              <span>宽度 (PX)</span>
              <input
                type="number"
                min={280}
                max={1400}
                value={customWidth}
                onChange={(event) => {
                  setCustomWidth(event.target.value)
                  setError('')
                }}
              />
            </label>

            <span className="window-size-custom__times" aria-hidden="true">
              x
            </span>

            <label className="window-size-field">
              <span>高度 (PX)</span>
              <input
                type="number"
                min={400}
                max={1600}
                value={customHeight}
                onChange={(event) => {
                  setCustomHeight(event.target.value)
                  setError('')
                }}
              />
            </label>
          </div>

          <div className="window-size-custom__preview" aria-hidden="true">
            <span
              className="window-size-custom__preview-frame"
              style={{ width: `${previewSize.width}px`, height: `${previewSize.height}px` }}
            />
          </div>
        </div>

        {error ? <p className="window-size-custom__error">{error}</p> : null}

        <button type="button" className="window-size-custom__submit" onClick={applyCustom}>
          使用自定义尺寸
        </button>
      </section>
    </div>
  )
}
