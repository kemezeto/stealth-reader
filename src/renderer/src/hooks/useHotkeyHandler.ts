import { useEffect } from 'react'
import { matchesHotkey } from '../../../shared/hotkeys'

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true
  if (target.isContentEditable) return true
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'))
}

export function useHotkeyHandler(
  accelerator: string,
  handler: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled || !accelerator.trim()) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (shouldIgnoreTarget(event.target)) return
      if (!matchesHotkey(event, accelerator)) return
      event.preventDefault()
      handler()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [accelerator, enabled, handler])
}
