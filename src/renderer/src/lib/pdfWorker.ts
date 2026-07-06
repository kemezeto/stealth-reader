import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/** 针对 ≤60MB PDF：启用分块拉取，避免一次性加载整文件 */
export const PDF_DOCUMENT_OPTIONS = {
  isEvalSupported: false,
  useSystemFonts: true,
  disableAutoFetch: false,
  disableStream: false,
  rangeChunkSize: 65536
} as const

export { Document, Page } from 'react-pdf'
