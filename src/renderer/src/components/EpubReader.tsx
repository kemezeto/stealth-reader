import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Book, Rendition } from 'epubjs'
import { ReactReader, ReactReaderStyle } from 'react-reader'
import type { BookMeta, BookProgress } from '../../../preload/types'
import { toArrayBuffer } from '../lib/bytes'
import { useHotkeyHandler } from '../hooks/useHotkeyHandler'

const GHOST_THEME = 'stealth-ghost'
const EPUB_GHOST_STYLE_ID = 'stealth-epub-ghost'
const EPUB_TEXT_COLOR_STYLE_ID = 'stealth-epub-text-color'
const EPUB_LINE_HEIGHT_STYLE_ID = 'stealth-epub-line-height'

type EpubContents = {
  document: Document
  css: (property: string, value: string, priority?: boolean) => void
}

function getRenditionContents(rendition: Rendition): EpubContents[] {
  return rendition.getContents() as unknown as EpubContents[]
}

function overrideThemeStyles(rendition: Rendition, selector: string, properties: Record<string, string>): void {
  const themes = rendition.themes as unknown as {
    override: (sel: string, props: Record<string, string>) => void
  }
  themes.override(selector, properties)
}

type RenditionWithManager = Rendition & {
  manager?: {
    container?: HTMLElement
  }
}

type ReactReaderStyleMap = typeof ReactReaderStyle

const EPUB_SELECTION_CSS = `
  html, body {
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: auto !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  ::selection {
    background: rgba(37, 99, 235, 0.25) !important;
  }
`

const EPUB_GHOST_CSS = `
  html,
  body {
    background: transparent !important;
    background-color: transparent !important;
  }

  body *,
  html * {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }

  img,
  svg,
  image,
  video {
    background: unset !important;
    background-color: unset !important;
  }
`

function applyTextColorToDocument(doc: Document, color: string): void {
  const style = doc.getElementById(EPUB_TEXT_COLOR_STYLE_ID) ?? doc.createElement('style')
  style.id = EPUB_TEXT_COLOR_STYLE_ID
  style.textContent = `
    html,
    body,
    p,
    span,
    div,
    li,
    td,
    th,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    a,
    em,
    strong,
    blockquote {
      color: ${color} !important;
    }
  `
  if (!style.isConnected) {
    doc.head.appendChild(style)
  }
}

function applyEpubTextColor(rendition: Rendition, color: string): void {
  for (const contents of getRenditionContents(rendition)) {
    applyTextColorToDocument(contents.document, color)
  }
}

function applyLineHeightToDocument(doc: Document, lineHeight: number): void {
  const style = doc.getElementById(EPUB_LINE_HEIGHT_STYLE_ID) ?? doc.createElement('style')
  style.id = EPUB_LINE_HEIGHT_STYLE_ID
  style.textContent = `
    html,
    body,
    p,
    span,
    div,
    li,
    td,
    th,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    a,
    em,
    strong,
    blockquote {
      line-height: ${lineHeight} !important;
    }
  `
  if (!style.isConnected) {
    doc.head.appendChild(style)
  }
}

function applyEpubLineHeight(rendition: Rendition, lineHeight: number): void {
  overrideThemeStyles(rendition, 'body', { 'line-height': String(lineHeight) })
  overrideThemeStyles(rendition, 'p', { 'line-height': String(lineHeight) })

  for (const contents of getRenditionContents(rendition)) {
    applyLineHeightToDocument(contents.document, lineHeight)
  }
}

function stripInlineBackgrounds(doc: Document): void {
  for (const el of doc.querySelectorAll<HTMLElement>('[style]')) {
    const style = el.style
    if (style.background || style.backgroundColor || style.backgroundImage) {
      style.setProperty('background', 'transparent', 'important')
      style.setProperty('background-color', 'transparent', 'important')
      style.setProperty('background-image', 'none', 'important')
    }
  }
}

function applyGhostStylesToDocument(doc: Document, enabled: boolean): void {
  const existing = doc.getElementById(EPUB_GHOST_STYLE_ID)
  if (enabled) {
    const style = existing ?? doc.createElement('style')
    style.id = EPUB_GHOST_STYLE_ID
    style.textContent = EPUB_GHOST_CSS
    if (!existing) {
      doc.head.appendChild(style)
    }
    doc.documentElement.style.setProperty('background-color', 'transparent', 'important')
    doc.body?.style.setProperty('background-color', 'transparent', 'important')
    stripInlineBackgrounds(doc)
    return
  }

  existing?.remove()
  doc.documentElement.style.removeProperty('background-color')
  doc.body?.style.removeProperty('background-color')
}

function applyEpubGhostChrome(rendition: Rendition, enabled: boolean): void {
  const manager = (rendition as RenditionWithManager).manager
  const container = manager?.container
  if (!container) return

  container.classList.add('epub-scroll-viewport')

  const backgroundColor = enabled ? 'transparent' : ''
  container.style.backgroundColor = backgroundColor

  for (const node of container.querySelectorAll<HTMLElement>('iframe, .epub-view, .epub-container')) {
    node.style.backgroundColor = backgroundColor
    if (enabled && node instanceof HTMLIFrameElement && node.contentDocument) {
      applyGhostStylesToDocument(node.contentDocument, true)
    }
  }
}

function applyEpubGhostStyles(rendition: Rendition, enabled: boolean): void {
  if (enabled) {
    rendition.themes.registerCss(GHOST_THEME, EPUB_GHOST_CSS)
    rendition.themes.select(GHOST_THEME)
  } else {
    rendition.themes.select('default')
  }

  for (const contents of getRenditionContents(rendition)) {
    applyGhostStylesToDocument(contents.document, enabled)
    if (enabled) {
      contents.css('background-color', 'transparent', true)
      contents.css('background', 'transparent', true)
    }
  }

  applyEpubGhostChrome(rendition, enabled)
}

interface EpubReaderProps {
  meta: BookMeta
  fontSize: number
  fontColor: string
  lineHeight: number
  contentOpacity: number
  ghostMode: boolean
  readerPrevPage: string
  readerNextPage: string
  onProgressChange: (progress: BookProgress) => void
}

export default function EpubReader({
  meta,
  fontSize,
  fontColor,
  lineHeight,
  contentOpacity,
  ghostMode,
  readerPrevPage,
  readerNextPage,
  onProgressChange
}: EpubReaderProps): JSX.Element {
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const ghostModeRef = useRef(ghostMode)
  const fontColorRef = useRef(fontColor)
  const lineHeightRef = useRef(lineHeight)
  const locationsReadyRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null)
  const [loadError, setLoadError] = useState('')
  const [location, setLocation] = useState<string | number | null>(meta.progress.location ?? null)

  const readerStyles = useMemo<ReactReaderStyleMap>(
    () => ({
      ...ReactReaderStyle,
      titleArea: {
        ...ReactReaderStyle.titleArea,
        display: 'none'
      },
      readerArea: {
        ...ReactReaderStyle.readerArea,
        backgroundColor: ghostMode ? 'transparent' : '#ffffff'
      },
      reader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      arrow: {
        ...ReactReaderStyle.arrow,
        display: 'none',
        pointerEvents: 'none'
      },
      prev: {
        display: 'none'
      },
      next: {
        display: 'none'
      }
    }),
    [ghostMode]
  )

  const epubOptions = useMemo(
    () => ({
      allowPopups: false,
      flow: 'scrolled-doc' as const,
      manager: 'continuous' as const
    }),
    []
  )

  useEffect(() => {
    locationsReadyRef.current = false
    setBookData(null)
    setLoadError('')
    setLocation(meta.progress.location ?? null)

    void window.stealth
      .getBookBytes(meta.id)
      .then((bytes) => setBookData(toArrayBuffer(bytes)))
      .catch((reason: unknown) => {
        setLoadError(reason instanceof Error ? reason.message : 'EPUB 文件读取失败')
      })
  }, [meta.id])

  const scheduleSave = useCallback(
    (next: BookProgress) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        onProgressChange(next)
      }, 400)
    },
    [onProgressChange]
  )

  const handleLocationChanged = useCallback(
    (cfi: string) => {
      setLocation(cfi)
      let percent = meta.progress.percent
      try {
        const value = bookRef.current?.locations.percentageFromCfi(cfi)
        if (typeof value === 'number' && !Number.isNaN(value)) {
          percent = value * 100
        }
      } catch {
        // locations 尚未生成完成时保留上次进度
      }
      scheduleSave({
        scrollTop: 0,
        percent,
        location: cfi,
        page: undefined
      })
    },
    [meta.progress.percent, scheduleSave]
  )

  const handleRendition = useCallback(
    (rendition: Rendition) => {
      renditionRef.current = rendition
      bookRef.current = rendition.book
      rendition.themes.fontSize(`${fontSize}px`)
      applyEpubTextColor(rendition, fontColorRef.current)
      applyEpubLineHeight(rendition, lineHeightRef.current)
      applyEpubGhostStyles(rendition, ghostModeRef.current)

      const manager = (rendition as RenditionWithManager).manager
      manager?.container?.classList.add('epub-scroll-viewport')

      rendition.on('rendered', () => {
        applyEpubTextColor(rendition, fontColorRef.current)
        applyEpubLineHeight(rendition, lineHeightRef.current)
        if (!ghostModeRef.current) return
        applyEpubGhostStyles(rendition, true)
      })

      rendition.hooks.content.register((contents: EpubContents) => {
        const doc = contents.document
        const style = doc.createElement('style')
        style.textContent = EPUB_SELECTION_CSS
        doc.head.appendChild(style)
        applyTextColorToDocument(doc, fontColorRef.current)
        applyLineHeightToDocument(doc, lineHeightRef.current)
        applyGhostStylesToDocument(doc, ghostModeRef.current)
      })

      if (!locationsReadyRef.current) {
        locationsReadyRef.current = true
        void rendition.book.ready.then(async () => {
          try {
            await rendition.book.locations.generate(1600)
          } catch {
            // 部分 EPUB 无法生成位置索引，仍可阅读
          }
        })
      }
    },
    [fontSize]
  )

  useEffect(() => {
    fontColorRef.current = fontColor
    const rendition = renditionRef.current
    if (!rendition) return
    applyEpubTextColor(rendition, fontColor)
  }, [fontColor])

  useEffect(() => {
    lineHeightRef.current = lineHeight
    const rendition = renditionRef.current
    if (!rendition) return
    applyEpubLineHeight(rendition, lineHeight)
  }, [lineHeight])

  useEffect(() => {
    ghostModeRef.current = ghostMode
    const rendition = renditionRef.current
    if (!rendition) return
    applyEpubGhostStyles(rendition, ghostMode)
  }, [ghostMode])

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}px`)
  }, [fontSize])

  const goPrev = useCallback(() => {
    renditionRef.current?.prev()
  }, [])

  const goNext = useCallback(() => {
    renditionRef.current?.next()
  }, [])

  useHotkeyHandler(readerPrevPage, goPrev)
  useHotkeyHandler(readerNextPage, goNext)

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  if (loadError) {
    return <div className="reader-state reader-state--error">{loadError}</div>
  }

  if (!bookData) {
    return <div className="reader-state">正在加载 EPUB…</div>
  }

  return (
    <div className={`epub-reader${ghostMode ? ' epub-reader--ghost' : ''}`} style={{ opacity: contentOpacity / 100 }}>
      <ReactReader
        url={bookData}
        location={location}
        locationChanged={handleLocationChanged}
        getRendition={handleRendition}
        readerStyles={readerStyles}
        showToc={false}
        swipeable={false}
        pageTurnOnScroll={false}
        epubInitOptions={{ openAs: 'binary' }}
        epubOptions={epubOptions}
        errorView={<div className="reader-state reader-state--error">EPUB 解析失败，文件可能已损坏</div>}
      />
    </div>
  )
}
