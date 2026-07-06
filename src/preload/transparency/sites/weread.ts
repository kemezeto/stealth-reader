export const WEREAD_HOST_PATTERN = /weread\.qq\.com$/i
export const WEREAD_READER_PATH_PATTERN = /\/web\/reader\//i

export function isWereadHost(hostname: string): boolean {
  return WEREAD_HOST_PATTERN.test(hostname)
}

export function isWereadReaderPage(pathname: string): boolean {
  return WEREAD_READER_PATH_PATTERN.test(pathname)
}

/** 微信读书网页版透明适配（参考社区 Tampermonkey 脚本） */
export const WEREAD_TRANSPARENCY_CSS = `
  html {
    background-color: rgba(255, 255, 255, 0.01) !important;
    background-image: none !important;
  }

  body,
  #root,
  #app {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
  }

  /* 阅读页 / 书架页容器 */
  .wr_whiteTheme,
  .wr_darkTheme,
  .wr_reading,
  .wr_readerWrapper,
  .wr_whiteTheme .readerContent,
  .wr_whiteTheme .readerContent .app_content,
  .wr_darkTheme .readerContent,
  .wr_darkTheme .readerContent .app_content,
  .wr_whiteTheme .readerTopBar,
  .wr_darkTheme .readerTopBar,
  .wr_whiteTheme .readerControls_fontSize,
  .wr_darkTheme .readerControls_fontSize,
  .wr_whiteTheme .readerControls_item,
  .wr_darkTheme .readerControls_item,
  .wr_whiteTheme .renderTargetContainer,
  .wr_whiteTheme .renderTargetContainer .renderTargetContent,
  .wr_darkTheme .renderTargetContainer,
  .wr_darkTheme .renderTargetContainer .renderTargetContent,
  .wr_whiteTheme .renderTargetContainer .renderTargetContent .wr_readerBackground_opacity,
  .wr_whiteTheme .renderTargetContainer .renderTargetContent .wr_readerImage_opacity,
  .wr_darkTheme .renderTargetContainer .renderTargetContent .wr_readerBackground_opacity,
  .wr_darkTheme .renderTargetContainer .renderTargetContent .wr_readerImage_opacity,
  .readerFooter,
  .navBarOffset,
  .wr_pageContainer,
  .wr_libraryHome,
  .wr_library,
  .wr_horizontalReader,
  .wr_horizontalScroll,
  .wr_bookGrid,
  .wr_bookList {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
  }

  /* 阅读器铺底图层：去掉纸色/黑底，正文仍在 renderTargetContent 上层 */
  .wr_readerBackground_opacity {
    opacity: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
  }

  /* 插图保留可见，仅去掉背后纸色 */
  .wr_readerImage_opacity {
    background: transparent !important;
    background-color: transparent !important;
  }

  img.wr_readerImage_opacity {
    opacity: 1 !important;
  }

  /* 正文区域不去背景，保证可读 */
  .readerChapterContent,
  .renderTargetContent .section,
  .renderTargetContent p,
  .renderTargetContent span,
  .renderTargetContent h1,
  .renderTargetContent h2,
  .renderTargetContent h3 {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* 首页/书架卡片：极淡底，避免完全消失难以点击 */
  .wr_bookListItem,
  .wr_horizontalBookItem,
  .wr_rankListItem {
    background-color: rgba(255, 255, 255, 0.06) !important;
  }

  .wr_darkTheme .wr_bookListItem,
  .wr_darkTheme .wr_horizontalBookItem,
  .wr_darkTheme .wr_rankListItem {
    background-color: rgba(0, 0, 0, 0.12) !important;
  }
`

/** 阅读页需要更激进地清掉层叠背景 */
export const WEREAD_READER_EXTRA_CSS = `
  .wr_darkTheme .readerContent,
  .wr_darkTheme .readerContent .app_content,
  .wr_darkTheme .renderTargetContainer,
  .wr_darkTheme .renderTargetContainer .renderTargetContent,
  .wr_whiteTheme .readerContent,
  .wr_whiteTheme .readerContent .app_content,
  .wr_whiteTheme .renderTargetContainer,
  .wr_whiteTheme .renderTargetContainer .renderTargetContent,
  .wr_darkTheme .readerTopBar,
  .wr_whiteTheme .readerTopBar,
  .wr_darkTheme .readerFooter,
  .wr_whiteTheme .readerFooter,
  .wr_darkTheme .wr_pageContainer,
  .wr_whiteTheme .wr_pageContainer {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    box-shadow: none !important;
  }

  .wr_darkTheme .wr_readerBackground_opacity,
  .wr_whiteTheme .wr_readerBackground_opacity {
    opacity: 0 !important;
    visibility: hidden !important;
  }
`

export const WEREAD_CRITICAL_SELECTORS = [
  'html',
  'body',
  '#root',
  '#app',
  '.wr_whiteTheme',
  '.wr_darkTheme',
  '.wr_reading',
  '.readerContent',
  '.app_content',
  '.renderTargetContainer',
  '.renderTargetContent',
  '.wr_readerBackground_opacity'
]
