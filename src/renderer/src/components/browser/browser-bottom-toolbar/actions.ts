import { Bookmark, History, Layers, PanelBottomClose, ScrollText, ZoomIn } from 'lucide-react'
import { isBookmarked } from '../browser-bookmarks'
import type { BrowserBottomToolbarAction } from './types'

/**
 * 浏览器底部工具栏功能注册表。
 * 后续新增功能时，在此数组中追加或替换 action 即可。
 */
export const browserBottomToolbarActions: BrowserBottomToolbarAction[] = [
  {
    id: 'auto-hide',
    label: '移出后隐藏图标',
    icon: PanelBottomClose,
    run: (ctx) => {
      ctx.onSettingsChange({ browserToolbarAutoHide: !ctx.settings.browserToolbarAutoHide })
    },
    isActive: (ctx) => ctx.settings.browserToolbarAutoHide ?? false
  },
  {
    id: 'scrollbar',
    label: '显示滚动条',
    icon: ScrollText,
    run: (ctx) => {
      const next = !(ctx.settings.browserShowScrollbar ?? true)
      ctx.onSettingsChange({ browserShowScrollbar: next })
      window.stealth.browserSetScrollbar(next)
    },
    isActive: (ctx) => ctx.settings.browserShowScrollbar ?? true
  },
  {
    id: 'zoom',
    label: '缩放',
    icon: ZoomIn,
    run: (ctx) => {
      ctx.toggleZoomSheet()
    },
    isActive: (ctx) => ctx.zoomSheetOpen
  },
  {
    id: 'bookmarks',
    label: '收藏夹',
    icon: Bookmark,
    run: (ctx) => {
      ctx.toggleBookmarkSheet()
    },
    isActive: (ctx) => ctx.bookmarkSheetOpen || isBookmarked(ctx.settings.browserBookmarks ?? [], ctx.currentUrl)
  },
  {
    id: 'history',
    label: '历史记录',
    icon: History,
    run: (ctx) => {
      ctx.toggleHistorySheet()
    },
    isActive: (ctx) => ctx.historySheetOpen
  },
  {
    id: 'transparent',
    label: '网页背景透明',
    icon: Layers,
    run: (ctx) => {
      const next = !(ctx.settings.transparentMode ?? true)
      ctx.onSettingsChange({ transparentMode: next })
      window.stealth.browserSetTransparency(next, ctx.settings.contentOpacity)
    },
    isActive: (ctx) => ctx.settings.transparentMode ?? true
  }
]
