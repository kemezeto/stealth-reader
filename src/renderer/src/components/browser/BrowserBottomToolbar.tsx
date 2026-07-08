import {
  browserBottomToolbarActions,
  type BrowserBottomToolbarContext
} from './browser-bottom-toolbar'

interface BrowserBottomToolbarProps {
  context: BrowserBottomToolbarContext
  iconsHidden?: boolean
}

export default function BrowserBottomToolbar({
  context,
  iconsHidden = false
}: BrowserBottomToolbarProps): JSX.Element {
  return (
    <nav
      className={`browser-bottom-toolbar${iconsHidden ? ' browser-bottom-toolbar--icons-hidden' : ''}`}
      aria-label="浏览器工具栏"
    >
      {browserBottomToolbarActions.map((action) => {
        const Icon = action.icon
        const disabled = action.isDisabled?.(context) ?? false
        const active = action.isActive?.(context) ?? false

        return (
          <button
            key={action.id}
            type="button"
            className={active ? 'is-active' : undefined}
            aria-label={action.label}
            aria-pressed={active || undefined}
            disabled={disabled}
            onClick={() => action.run(context)}
          >
            <span className="browser-bottom-toolbar__icon" aria-hidden="true">
              <Icon size={14} strokeWidth={2} />
            </span>
          </button>
        )
      })}
    </nav>
  )
}
