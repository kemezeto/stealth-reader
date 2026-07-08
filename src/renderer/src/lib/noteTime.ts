import type { NoteRecord } from '../../../preload/types'

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function formatNoteTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatNoteGroupLabel(timestamp: number, now = Date.now()): string {
  const dayStart = startOfDay(timestamp)
  const todayStart = startOfDay(now)
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

  if (dayStart === todayStart) return '今天'
  if (dayStart === yesterdayStart) return '昨天'

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const currentYear = new Date(now).getFullYear()

  if (year === currentYear) {
    return `${month}月${day}日`
  }

  return `${year}年${month}月${day}日`
}

export function groupNotesByDate(notes: NoteRecord[]): Array<{ label: string; notes: NoteRecord[] }> {
  const groups: Array<{ label: string; notes: NoteRecord[] }> = []

  for (const note of notes) {
    const label = formatNoteGroupLabel(note.updatedAt)
    const last = groups[groups.length - 1]
    if (last?.label === label) {
      last.notes.push(note)
    } else {
      groups.push({ label, notes: [note] })
    }
  }

  return groups
}

export function notePreview(content: string, maxLength = 120): string {
  const compact = content.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength)}…`
}
