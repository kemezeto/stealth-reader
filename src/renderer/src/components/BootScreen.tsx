export default function BootScreen(): JSX.Element {
  return (
    <div className="boot">
      <div className="boot__card">
        <span className="boot__mark" aria-hidden="true" />
        <p className="boot__title">Stealth Reader</p>
        <p className="boot__subtitle">正在启动…</p>
      </div>
    </div>
  )
}
