import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { BookMeta, BookProgress } from '../../../preload/types'
import { Document, Page, PDF_DOCUMENT_OPTIONS } from '../lib/pdfWorker'
import { pdfOutlineToTocItems, resolvePdfOutlinePage } from '../lib/pdfOutline'
import { useHotkeyHandler } from '../hooks/useHotkeyHandler'
import ReaderTocSheet from './reader/ReaderTocSheet'
import type { ReaderTocApi, TocItem } from '../types/toc'

type PdfFitMode = 'width' | 'page' | 'custom'

const PAGE_PADDING = 24
const ZOOM_STEP = 0.1
const WHEEL_ZOOM_STEP = 0.06
const SCALE_MIN = 0.25
const SCALE_MAX = 4
const DRAG_THRESHOLD = 4

interface PdfReaderProps {
  meta: BookMeta
  contentOpacity: number
  readerPrevPage: string
  readerNextPage: string
  onProgressChange: (progress: BookProgress) => void
  onTocApiChange?: (api: ReaderTocApi | null) => void
}

export default function PdfReader({
  meta,
  contentOpacity,
  readerPrevPage,
  readerNextPage,
  onProgressChange,
  onTocApiChange
}: PdfReaderProps): JSX.Element {
  const pageAreaRef = useRef<HTMLDivElement | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0
  })
  const stateRef = useRef({
    fitMode: 'width' as PdfFitMode,
    zoom: 1,
    pageSize: { w: 0, h: 0 },
    viewport: { w: 320, h: 480 },
    fitPageScale: 1
  })

  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(meta.progress.page && meta.progress.page > 0 ? meta.progress.page : 1)
  const [pageInput, setPageInput] = useState('')
  const [viewport, setViewport] = useState({ w: 320, h: 480 })
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 })
  const [fitMode, setFitMode] = useState<PdfFitMode>('width')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loadProgress, setLoadProgress] = useState<number | null>(null)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [tocOpen, setTocOpen] = useState(false)

  const resetPan = useCallback(() => {
    setPan({ x: 0, y: 0 })
  }, [])

  const goPrev = useCallback(() => {
    setPageNumber((page) => Math.max(1, page - 1))
  }, [])

  const goNext = useCallback(() => {
    setPageNumber((page) => (numPages > 0 ? Math.min(numPages, page + 1) : page + 1))
  }, [numPages])

  const jumpToPage = useCallback(
    (raw: string) => {
      const parsed = Number.parseInt(raw.trim(), 10)
      if (Number.isNaN(parsed) || numPages <= 0) return
      setPageNumber(Math.min(Math.max(parsed, 1), numPages))
    },
    [numPages]
  )

  useHotkeyHandler(readerPrevPage, goPrev)
  useHotkeyHandler(readerNextPage, goNext)

  const fitPageScale = useMemo(() => {
    if (!pageSize.w || !pageSize.h) return 1
    const availableW = viewport.w - PAGE_PADDING
    const availableH = viewport.h - PAGE_PADDING
    return Math.min(availableW / pageSize.w, availableH / pageSize.h)
  }, [pageSize.h, pageSize.w, viewport.h, viewport.w])

  const getEffectiveScale = useCallback((): number => {
    const { fitMode: mode, zoom: customZoom, pageSize: size, viewport: vp, fitPageScale: pageScale } =
      stateRef.current
    if (!size.w) return 1
    if (mode === 'custom') return customZoom
    if (mode === 'page') return pageScale
    return (vp.w - PAGE_PADDING) / size.w
  }, [])

  const applyScale = useCallback(
    (nextScale: number) => {
      const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, +nextScale.toFixed(3)))
      setFitMode('custom')
      setZoom(clamped)
    },
    []
  )

  const zoomIn = useCallback(() => {
    applyScale(getEffectiveScale() + ZOOM_STEP)
  }, [applyScale, getEffectiveScale])

  const zoomOut = useCallback(() => {
    applyScale(getEffectiveScale() - ZOOM_STEP)
  }, [applyScale, getEffectiveScale])

  const selectFitMode = useCallback(
    (mode: PdfFitMode) => {
      setFitMode(mode)
      resetPan()
    },
    [resetPan]
  )

  stateRef.current = { fitMode, zoom, pageSize, viewport, fitPageScale }

  const scheduleSave = useCallback(
    (page: number, total: number) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        const percent = total > 0 ? (page / total) * 100 : 0
        onProgressChange({
          scrollTop: 0,
          percent,
          page,
          location: undefined
        })
      }, 300)
    },
    [onProgressChange]
  )

  const openToc = useCallback(() => {
    setTocOpen(true)
  }, [])

  const handleTocSelect = useCallback(
    (item: TocItem) => {
      const pdf = pdfRef.current
      if (!pdf) return
      void resolvePdfOutlinePage(pdf, item.dest).then((page) => {
        if (page) {
          setPageNumber(page)
          resetPan()
        }
      })
    },
    [resetPan]
  )

  useEffect(() => {
    onTocApiChange?.({
      hasToc: tocItems.length > 0,
      openToc
    })
  }, [onTocApiChange, openToc, tocItems])

  useEffect(() => {
    return () => {
      onTocApiChange?.(null)
    }
  }, [onTocApiChange])

  useEffect(() => {
    setError('')
    setNumPages(0)
    setLoadProgress(null)
    setPageSize({ w: 0, h: 0 })
    setFitMode('width')
    setZoom(1)
    setTocItems([])
    setTocOpen(false)
    pdfRef.current = null
    resetPan()
    const initialPage = meta.progress.page && meta.progress.page > 0 ? meta.progress.page : 1
    setPageNumber(initialPage)
    setPageInput(String(initialPage))
  }, [meta.id, meta.progress.page, resetPan])

  useEffect(() => {
    resetPan()
  }, [pageNumber, resetPan])

  useEffect(() => {
    setPageInput(String(pageNumber))
  }, [pageNumber])

  useEffect(() => {
    const node = pageAreaRef.current
    if (!node) return

    const updateViewport = (): void => {
      setViewport({
        w: Math.max(240, node.clientWidth),
        h: Math.max(320, node.clientHeight)
      })
    }

    updateViewport()
    const observer = new ResizeObserver(updateViewport)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (numPages > 0) {
      scheduleSave(pageNumber, numPages)
    }
  }, [numPages, pageNumber, scheduleSave])

  useEffect(() => {
    const node = pageAreaRef.current
    if (!node) return

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
      applyScale(getEffectiveScale() + delta)
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [applyScale, getEffectiveScale])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent): void => {
      if (!dragRef.current.active) return

      const dx = event.clientX - dragRef.current.startX
      const dy = event.clientY - dragRef.current.startY
      if (!dragRef.current.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        dragRef.current.moved = true
        setDragging(true)
      }
      if (!dragRef.current.moved) return

      setPan({
        x: dragRef.current.panX + dx,
        y: dragRef.current.panY + dy
      })
    }

    const onMouseUp = (): void => {
      dragRef.current.active = false
      dragRef.current.moved = false
      setDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        goPrev()
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        goNext()
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomIn()
      }
      if (event.key === '-') {
        event.preventDefault()
        zoomOut()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, zoomIn, zoomOut])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const effectiveScale = useMemo(() => {
    if (!pageSize.w) return 1
    if (fitMode === 'custom') return zoom
    if (fitMode === 'page') return fitPageScale
    return (viewport.w - PAGE_PADDING) / pageSize.w
  }, [fitMode, fitPageScale, pageSize.w, viewport.w, zoom])

  const displayPercent = Math.round(effectiveScale * 100)

  const handlePageLoad = useCallback((page: PDFPageProxy) => {
    const vp = page.getViewport({ scale: 1 })
    setPageSize({ w: vp.width, h: vp.height })
  }, [])

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y
    }
  }

  if (error) {
    return <div className="reader-state reader-state--error">{error}</div>
  }

  return (
    <div className="pdf-reader" style={{ opacity: contentOpacity / 100 }}>
      <div className="pdf-reader__toolbar">
        <div className="pdf-reader__group">
          <button
            type="button"
            className={fitMode === 'width' ? 'pdf-btn is-active' : 'pdf-btn'}
            onClick={() => selectFitMode('width')}
          >
            适应宽
          </button>
          <button
            type="button"
            className={fitMode === 'page' ? 'pdf-btn is-active' : 'pdf-btn'}
            onClick={() => selectFitMode('page')}
          >
            适应页
          </button>
        </div>
        <div className="pdf-reader__group">
          <button type="button" className="pdf-btn pdf-btn--icon" onClick={zoomOut} aria-label="缩小">
            −
          </button>
          <span className="pdf-reader__zoom">{displayPercent}%</span>
          <button type="button" className="pdf-btn pdf-btn--icon" onClick={zoomIn} aria-label="放大">
            +
          </button>
        </div>
      </div>

      <div
        ref={pageAreaRef}
        className={dragging ? 'pdf-reader__page is-dragging' : 'pdf-reader__page'}
        onMouseDown={handleMouseDown}
        role="presentation"
      >
        <div
          className="pdf-reader__stage"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <Document
            key={meta.id}
            file={meta.fileUrl}
            options={PDF_DOCUMENT_OPTIONS}
            loading={
              <div className="reader-state">
                {loadProgress !== null ? `正在打开 PDF… ${loadProgress}%` : '正在打开 PDF…'}
              </div>
            }
            onLoadProgress={({ loaded, total }) => {
              if (total > 0) {
                setLoadProgress(Math.min(99, Math.round((loaded / total) * 100)))
              }
            }}
            onLoadSuccess={(pdf) => {
              pdfRef.current = pdf
              setLoadProgress(100)
              setNumPages(pdf.numPages)
              setPageNumber((current) => Math.min(Math.max(current, 1), pdf.numPages))
              void pdf.getOutline().then((outline) => {
                setTocItems(outline?.length ? pdfOutlineToTocItems(outline) : [])
              })
            }}
            onLoadError={(reason) => {
              setError(reason instanceof Error ? reason.message : 'PDF 加载失败')
            }}
          >
            {numPages > 0 ? (
              <Page
                key={`${meta.id}-${pageNumber}-${effectiveScale.toFixed(3)}`}
                pageNumber={pageNumber}
                scale={effectiveScale}
                onLoadSuccess={handlePageLoad}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<div className="reader-state">渲染页面…</div>}
              />
            ) : null}
          </Document>
        </div>
      </div>

      <div className="pdf-reader__footer">
        <button type="button" className="pdf-btn" disabled={pageNumber <= 1} onClick={goPrev}>
          上一页
        </button>
        <label className="pdf-reader__page-jump">
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                jumpToPage(pageInput)
                event.currentTarget.blur()
              }
            }}
            onBlur={() => jumpToPage(pageInput)}
            aria-label="页码"
          />
          <span>/ {numPages || '–'}</span>
        </label>
        <button type="button" className="pdf-btn" disabled={numPages === 0 || pageNumber >= numPages} onClick={goNext}>
          下一页
        </button>
      </div>
      <ReaderTocSheet
        open={tocOpen}
        items={tocItems}
        onClose={() => setTocOpen(false)}
        onSelect={handleTocSelect}
      />
    </div>
  )
}
