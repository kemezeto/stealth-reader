const COVER_GRADIENTS = [
  'linear-gradient(160deg, #dbeafe 0%, #eff6ff 55%, #f8fafc 100%)',
  'linear-gradient(160deg, #fde68a 0%, #fef3c7 55%, #fffbeb 100%)',
  'linear-gradient(160deg, #bbf7d0 0%, #dcfce7 55%, #f0fdf4 100%)',
  'linear-gradient(160deg, #fbcfe8 0%, #fce7f3 55%, #fdf2f8 100%)',
  'linear-gradient(160deg, #c7d2fe 0%, #e0e7ff 55%, #eef2ff 100%)',
  'linear-gradient(160deg, #fed7aa 0%, #ffedd5 55%, #fff7ed 100%)'
]

export function coverGradientForTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash + title.charCodeAt(i) * (i + 1)) % 9973
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

export function formatLabel(format: string): string {
  return format.toUpperCase()
}

export function formatProgress(value: number): string {
  if (value <= 0) return ''
  if (value < 0.1) return '0.1%'
  return `${value.toFixed(1)}%`
}
