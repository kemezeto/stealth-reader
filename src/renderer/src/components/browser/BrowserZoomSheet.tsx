import { useMemo } from 'react'
import type { AppSettings } from '../../../../preload/types'
import {
  BROWSER_ZOOM_DEFAULT,
  BROWSER_ZOOM_MAX,
  BROWSER_ZOOM_MIN,
  clampBrowserZoomPercent,
  persistBrowserZoomChange,
  resolveBrowserZoomPercent,
  type BrowserZoomScope
} from './browser-zoom'

interface BrowserZoomSheetProps {
  open: boolean
  settings: AppSettings
  currentUrl: string
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onClose: () => void
}

function sliderFillPercent(value: number): number {
  return ((value - BROWSER_ZOOM_MIN) / (BROWSER_ZOOM_MAX - BROWSER_ZOOM_MIN)) * 100
}

export default function BrowserZoomSheet({
  open,
  settings,
  currentUrl,
  onSettingsChange,
  onClose
}: BrowserZoomSheetProps): JSX.Element | null {
  const scope = settings.browserZoomScope ?? 'domain'
  const zoomPercent = useMemo(
    () => resolveBrowserZoomPercent(settings, currentUrl),
    [currentUrl, settings]
  )

  if (!open) return null

  const applyZoom = (percent: number): void => {
    const next = clampBrowserZoomPercent(percent)
    onSettingsChange(persistBrowserZoomChange(settings, currentUrl, next))
    window.stealth.browserSetZoom(next / 100)
  }

  const handleScopeChange = (nextScope: BrowserZoomScope): void => {
    if (nextScope === scope) return

    const merged = { ...settings, browserZoomScope: nextScope }
    onSettingsChange({ browserZoomScope: nextScope })

    const resolved = resolveBrowserZoomPercent(merged, currentUrl)
    window.stealth.browserSetZoom(resolved / 100)
  }

  return (
    <div className="browser-zoom-sheet-wrap">
      <button type="button" className="browser-zoom-sheet__backdrop" aria-label="关闭缩放面板" onClick={onClose} />
      <section className="browser-zoom-sheet" aria-label="缩放调节">
        <div className="browser-zoom-sheet__section">
          <div className="browser-zoom-sheet__header">
            <span className="browser-zoom-sheet__heading">缩放调节</span>
            <button type="button" className="browser-zoom-sheet__reset" onClick={() => applyZoom(BROWSER_ZOOM_DEFAULT)}>
              重置
            </button>
          </div>

          <div className="browser-zoom-sheet__value">{zoomPercent}%</div>

          <input
            type="range"
            className="browser-zoom-sheet__range"
            min={BROWSER_ZOOM_MIN}
            max={BROWSER_ZOOM_MAX}
            step={1}
            value={zoomPercent}
            style={{ '--range-fill': `${sliderFillPercent(zoomPercent)}%` } as React.CSSProperties}
            aria-label="缩放比例"
            onChange={(event) => applyZoom(Number(event.target.value))}
          />

          <div className="browser-zoom-sheet__range-labels">
            <span>{BROWSER_ZOOM_MIN}%</span>
            <span>{BROWSER_ZOOM_MAX}%</span>
          </div>
        </div>

        <div className="browser-zoom-sheet__divider" />

        <div className="browser-zoom-sheet__section">
          <div className="browser-zoom-sheet__subheading">缩放控制范围</div>
          <div className="browser-zoom-sheet__segmented" role="group" aria-label="缩放控制范围">
            <button
              type="button"
              className={scope === 'domain' ? 'is-active' : undefined}
              aria-pressed={scope === 'domain'}
              onClick={() => handleScopeChange('domain')}
            >
              按域名
            </button>
            <button
              type="button"
              className={scope === 'global' ? 'is-active' : undefined}
              aria-pressed={scope === 'global'}
              onClick={() => handleScopeChange('global')}
            >
              全局
            </button>
          </div>
        </div>

        <p className="browser-zoom-sheet__hint">关闭面板后，可按住 Ctrl+滚轮缩放</p>
      </section>
    </div>
  )
}
