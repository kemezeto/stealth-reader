import { closeSync, createReadStream, openSync, readSync, statSync } from 'fs'
import { extname } from 'path'
import { Readable } from 'stream'
import { protocol } from 'electron'
import { resolveBookFilePath } from './store'

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.epub': 'application/epub+zip',
  '.txt': 'text/plain; charset=utf-8'
}

/** 单次 Range 响应上限，避免 pdf.js 一次拉取整本 60MB 文件 */
const MAX_RANGE_BYTES = 2 * 1024 * 1024

function mimeFor(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function readFileRange(filePath: string, start: number, end: number): Buffer {
  const length = end - start + 1
  const buffer = Buffer.alloc(length)
  const fd = openSync(filePath, 'r')
  try {
    readSync(fd, buffer, 0, length, start)
  } finally {
    closeSync(fd)
  }
  return buffer
}

export function registerBookScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'localbook',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
        bypassCSP: true
      }
    }
  ])
}

export function registerBookProtocol(): void {
  protocol.handle('localbook', async (request) => {
    const bookId = new URL(request.url).hostname
    if (!bookId) {
      return new Response('Not found', { status: 404 })
    }

    const filePath = resolveBookFilePath(bookId)
    if (!filePath) {
      return new Response('Not found', { status: 404 })
    }

    const stat = statSync(filePath)
    const total = stat.size
    const contentType = mimeFor(filePath)
    const baseHeaders = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    }

    const rangeHeader = request.headers.get('Range')
    if (rangeHeader) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader)
      if (match) {
        const start = Number(match[1])
        let end = match[2] ? Number(match[2]) : total - 1
        if (end - start + 1 > MAX_RANGE_BYTES) {
          end = start + MAX_RANGE_BYTES - 1
        }
        if (start >= total || end >= total || start > end) {
          return new Response('Range not satisfiable', {
            status: 416,
            headers: {
              ...baseHeaders,
              'Content-Range': `bytes */${total}`
            }
          })
        }

        const chunk = readFileRange(filePath, start, end)
        return new Response(chunk, {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Length': String(chunk.length),
            'Content-Range': `bytes ${start}-${end}/${total}`
          }
        })
      }
    }

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>
    return new Response(stream, {
      headers: {
        ...baseHeaders,
        'Content-Length': String(total)
      }
    })
  })
}
