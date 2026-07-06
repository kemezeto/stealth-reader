import { readFileSync } from 'fs'
import jschardet from 'jschardet'
import iconv from 'iconv-lite'

const FALLBACK_ENCODINGS = ['utf-8', 'gb18030', 'gbk', 'big5']

function normalizeEncoding(raw: string | undefined): string {
  if (!raw) return 'utf-8'
  const lower = raw.toLowerCase().replace(/_/g, '-')
  if (lower.includes('utf-8') || lower === 'ascii') return 'utf-8'
  if (lower.includes('gb18030')) return 'gb18030'
  if (lower.includes('gbk') || lower.includes('gb2312')) return 'gbk'
  if (lower.includes('big5')) return 'big5'
  return lower
}

function decodeBuffer(buffer: Buffer, encoding: string): string {
  try {
    return iconv.decode(buffer, encoding)
  } catch {
    return iconv.decode(buffer, 'utf-8')
  }
}

function looksBroken(text: string): boolean {
  const sample = text.slice(0, 4000)
  if (!sample) return false
  const replacementCount = (sample.match(/\uFFFD/g) ?? []).length
  return replacementCount > Math.max(3, sample.length * 0.02)
}

export function readTxtFile(filePath: string): { text: string; encoding: string } {
  const buffer = readFileSync(filePath)
  const detected = jschardet.detect(buffer)
  const candidates = [
    normalizeEncoding(detected?.encoding),
    ...FALLBACK_ENCODINGS
  ].filter((value, index, list) => list.indexOf(value) === index)

  let bestText = ''
  let bestEncoding = 'utf-8'

  for (const encoding of candidates) {
    const text = decodeBuffer(buffer, encoding)
    if (!looksBroken(text)) {
      return { text, encoding }
    }
    if (!bestText || text.length > bestText.length) {
      bestText = text
      bestEncoding = encoding
    }
  }

  return { text: bestText, encoding: bestEncoding }
}
