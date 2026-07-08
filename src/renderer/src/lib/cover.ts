import type { BookFormat } from '../../../preload/types'

export function formatLabel(format: BookFormat | string): string {
  return format.toUpperCase()
}

export function formatProgress(value: number): string {
  if (value <= 0) return ''
  if (value < 0.1) return '0.1%'
  return `${value.toFixed(1)}%`
}
