import { BookOpen, Home, NotebookPen, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActiveTab } from '../../../preload/types'

interface BottomNavProps {
  activeTab: ActiveTab
  onChange: (tab: ActiveTab) => void
}

const ITEMS: Array<{ id: ActiveTab; label: string; icon: LucideIcon }> = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'bookshelf', label: '书架', icon: BookOpen },
  { id: 'notes', label: '笔记', icon: NotebookPen },
  { id: 'settings', label: '我的', icon: UserRound }
]

export default function BottomNav({ activeTab, onChange }: BottomNavProps): JSX.Element {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {ITEMS.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.id}
            type="button"
            className={item.id === activeTab ? 'is-active' : undefined}
            aria-current={item.id === activeTab ? 'page' : undefined}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={2} />
            </span>
          </button>
        )
      })}
    </nav>
  )
}
