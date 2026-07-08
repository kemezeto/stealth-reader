import { useEffect, useState } from 'react'
import type { BookMeta, BookProgress } from '../../../preload/types'
import type { ReaderTocApi } from '../types/toc'
import EpubReader from './EpubReader'
import LocalReader from './LocalReader'
import PdfReader from './PdfReader'

interface BookReaderProps {
  bookId: string
  fontSize: number
  epubFontColor: string
  epubLineHeight: number
  contentOpacity: number
  ghostMode: boolean
  readerPrevPage: string
  readerNextPage: string
  onProgressChange: (progress: BookProgress) => void
  onTocApiChange?: (api: ReaderTocApi | null) => void
}

export default function BookReader({
  bookId,
  fontSize,
  epubFontColor,
  epubLineHeight,
  contentOpacity,
  ghostMode,
  readerPrevPage,
  readerNextPage,
  onProgressChange,
  onTocApiChange
}: BookReaderProps): JSX.Element {
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError('')
    setMeta(null)

    void window.stealth
      .getBookMeta(bookId)
      .then((loaded) => {
        setMeta(loaded)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '加载失败')
        setLoading(false)
      })
  }, [bookId])

  if (loading) {
    return <div className="reader-state">正在打开书籍…</div>
  }

  if (error) {
    return <div className="reader-state reader-state--error">{error}</div>
  }

  if (!meta) {
    return <div className="reader-state">未找到书籍</div>
  }

  if (meta.format === 'txt') {
    return (
      <LocalReader
        bookId={bookId}
        fontSize={fontSize}
        contentOpacity={contentOpacity}
        readerPrevPage={readerPrevPage}
        readerNextPage={readerNextPage}
        onProgressChange={onProgressChange}
      />
    )
  }

  if (meta.format === 'epub') {
    return (
      <EpubReader
        meta={meta}
        fontSize={fontSize}
        fontColor={epubFontColor}
        lineHeight={epubLineHeight}
        contentOpacity={contentOpacity}
        ghostMode={ghostMode}
        readerPrevPage={readerPrevPage}
        readerNextPage={readerNextPage}
        onProgressChange={onProgressChange}
        onTocApiChange={onTocApiChange}
      />
    )
  }

  return (
    <PdfReader
      meta={meta}
      contentOpacity={contentOpacity}
      readerPrevPage={readerPrevPage}
      readerNextPage={readerNextPage}
      onProgressChange={onProgressChange}
      onTocApiChange={onTocApiChange}
    />
  )
}
