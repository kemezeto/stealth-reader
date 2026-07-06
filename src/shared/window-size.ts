export type WindowSizePreset = 'portrait' | 'landscape' | 'custom'

export interface WindowSize {
  width: number
  height: number
}

export const WINDOW_SIZE_PRESETS: Record<'portrait' | 'landscape', WindowSize> = {
  portrait: { width: 410, height: 820 },
  landscape: { width: 820, height: 600 }
}

export const WINDOW_SIZE_LIMITS = {
  minWidth: 280,
  maxWidth: 1400,
  minHeight: 400,
  maxHeight: 1600
}

export function inferWindowSizePreset(width: number, height: number): WindowSizePreset {
  if (
    width === WINDOW_SIZE_PRESETS.portrait.width &&
    height === WINDOW_SIZE_PRESETS.portrait.height
  ) {
    return 'portrait'
  }
  if (
    width === WINDOW_SIZE_PRESETS.landscape.width &&
    height === WINDOW_SIZE_PRESETS.landscape.height
  ) {
    return 'landscape'
  }
  return 'custom'
}

export function validateWindowSize(
  width: number,
  height: number
): { ok: true } | { ok: false; message: string } {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { ok: false, message: '请输入有效的整数宽度与高度。' }
  }

  const w = Math.round(width)
  const h = Math.round(height)

  if (w < WINDOW_SIZE_LIMITS.minWidth || w > WINDOW_SIZE_LIMITS.maxWidth) {
    return {
      ok: false,
      message: `建议宽度范围 ${WINDOW_SIZE_LIMITS.minWidth}-${WINDOW_SIZE_LIMITS.maxWidth}px。`
    }
  }

  if (h < WINDOW_SIZE_LIMITS.minHeight || h > WINDOW_SIZE_LIMITS.maxHeight) {
    return {
      ok: false,
      message: `建议高度范围 ${WINDOW_SIZE_LIMITS.minHeight}-${WINDOW_SIZE_LIMITS.maxHeight}px。`
    }
  }

  return { ok: true }
}

export function clampWindowSize(width: number, height: number): WindowSize {
  return {
    width: Math.min(
      WINDOW_SIZE_LIMITS.maxWidth,
      Math.max(WINDOW_SIZE_LIMITS.minWidth, Math.round(width))
    ),
    height: Math.min(
      WINDOW_SIZE_LIMITS.maxHeight,
      Math.max(WINDOW_SIZE_LIMITS.minHeight, Math.round(height))
    )
  }
}
