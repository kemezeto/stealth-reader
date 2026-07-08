import type { PDFDocumentProxy, RefProxy } from 'pdfjs-dist'
import type { TocItem } from '../types/toc'

type PdfOutlineNode = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number]

export function pdfOutlineToTocItems(items: PdfOutlineNode[], parentId = ''): TocItem[] {
  return items.map((item, index) => {
    const id = parentId ? `${parentId}-${index}` : String(index)
    return {
      id,
      label: item.title,
      dest: item.dest,
      subitems: item.items?.length ? pdfOutlineToTocItems(item.items as PdfOutlineNode[], id) : undefined
    }
  })
}

export async function resolvePdfOutlinePage(
  pdf: PDFDocumentProxy,
  dest: string | Array<unknown> | null | undefined
): Promise<number | null> {
  if (!dest) return null

  let destArray = dest
  if (typeof dest === 'string') {
    destArray = await pdf.getDestination(dest)
  }
  if (!Array.isArray(destArray) || destArray.length === 0) return null

  try {
    const pageIndex = await pdf.getPageIndex(destArray[0] as RefProxy)
    return pageIndex + 1
  } catch {
    return null
  }
}
