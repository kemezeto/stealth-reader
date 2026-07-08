import type { LucideIcon } from 'lucide-react'
import type { AppSettings } from '../../../../../preload/types'

export interface BrowserBottomToolbarContext {
  settings: AppSettings
  onSettingsChange: (partial: Partial<AppSettings>) => void
  currentUrl: string
  toggleZoomSheet: () => void
  zoomSheetOpen: boolean
  toggleBookmarkSheet: () => void
  bookmarkSheetOpen: boolean
  toggleHistorySheet: () => void
  historySheetOpen: boolean
}

export interface BrowserBottomToolbarAction {
  id: string
  label: string
  icon: LucideIcon
  run: (ctx: BrowserBottomToolbarContext) => void
  isDisabled?: (ctx: BrowserBottomToolbarContext) => boolean
  isActive?: (ctx: BrowserBottomToolbarContext) => boolean
}
