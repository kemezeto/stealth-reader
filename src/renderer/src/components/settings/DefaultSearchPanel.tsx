import type { AppSettings, SearchEngine } from '../../../../preload/types'
import { SEARCH_ENGINE_OPTIONS } from '../../../../shared/search-engine'

interface DefaultSearchPanelProps {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
}

export default function DefaultSearchPanel({
  settings,
  onSettingsChange
}: DefaultSearchPanelProps): JSX.Element {
  return (
    <div className="default-search-panel">
      <section className="default-search-section">
        <header className="default-search-section__header">
          <span className="default-search-section__mark" aria-hidden="true" />
          <div>
            <h3 className="default-search-section__title">默认搜索引擎</h3>
            <p className="default-search-section__desc">
              选择在主页地址栏输入非网址内容时使用的搜索平台
            </p>
          </div>
        </header>

        <div className="default-search-options" role="radiogroup" aria-label="默认搜索引擎">
          {SEARCH_ENGINE_OPTIONS.map((option) => {
            const active = settings.searchEngine === option.id

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? 'default-search-option default-search-option--active' : 'default-search-option'}
                onClick={() => onSettingsChange({ searchEngine: option.id as SearchEngine })}
              >
                <span className="default-search-option__radio" aria-hidden="true">
                  <span className="default-search-option__dot" />
                </span>
                <span className="default-search-option__label">{option.label}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
