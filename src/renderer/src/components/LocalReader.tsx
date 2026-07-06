import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookContent, BookProgress } from '../../../preload/types'
import { useHotkeyHandler } from '../hooks/useHotkeyHandler'

interface LocalReaderProps {
  bookId: string
  fontSize: number
  contentOpacity: number
  readerPrevPage: string
  readerNextPage: string
  onProgressChange: (progress: BookProgress) => void
}

export default function LocalReader({
  bookId,
  fontSize,
  contentOpacity,
  readerPrevPage,
  readerNextPage,
  onProgressChange
}: LocalReaderProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const restoredRef = useRef(false)
  const [content, setContent] = useState<BookContent | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoredRef.current = false
    setLoading(true)
    setError('')
    setContent(null)

    void window.stealth
      .getBookContent(bookId)
      .then((loaded) => {
        setContent(loaded)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '加载失败')
        setLoading(false)
      })
  }, [bookId])

  useEffect(() => {
    const node = scrollRef.current
    if (!content || !node || restoredRef.current) return

    requestAnimationFrame(() => {
      node.scrollTop = content.progress.scrollTop
      restoredRef.current = true
    })
  }, [content])

  const scheduleSave = useCallback(
    (scrollTop: number, percent: number) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        onProgressChange({ scrollTop, percent })
      }, 400)
    },
    [onProgressChange]
  )

  const handleScroll = (): void => {
    const node = scrollRef.current
    if (!node) return
    const maxScroll = Math.max(1, node.scrollHeight - node.clientHeight)
    const percent = (node.scrollTop / maxScroll) * 100
    scheduleSave(node.scrollTop, percent)
  }

  const scrollPage = useCallback((direction: -1 | 1): void => {
    const node = scrollRef.current
    if (!node) return
    const delta = Math.max(240, node.clientHeight * 0.85) * direction
    node.scrollBy({ top: delta, behavior: 'smooth' })
  }, [])

  useHotkeyHandler(readerPrevPage, () => scrollPage(-1))
  useHotkeyHandler(readerNextPage, () => scrollPage(1))

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  if (loading) {
    return <div className="reader-state">正在打开书籍…</div>
  }

  if (error) {
    return <div className="reader-state reader-state--error">{error}</div>
  }

  if (!content) {
    return <div className="reader-state">未找到书籍内容</div>
  }

  return (
    <article className="local-reader">
      <header className="local-reader__header">
        <h1>{content.title}</h1>
        <span className="reader-badge">{content.encoding.toUpperCase()}</span>
      </header>
      <div
        ref={scrollRef}
        className="local-reader__scroll"
        onScroll={handleScroll}
        style={{
          opacity: contentOpacity / 100,
          fontSize: `${fontSize}px`
        }}
      >
        <pre className="local-reader__text">{content.text}</pre>
      </div>
    </article>
  )
}
