import type { NoteRecord } from '../../../preload/types'

function assertNotesApi(): void {
  const api = window.stealth
  if (
    typeof api?.listNotes !== 'function' ||
    typeof api?.createNote !== 'function' ||
    typeof api?.updateNote !== 'function' ||
    typeof api?.removeNote !== 'function'
  ) {
    throw new Error('笔记接口未加载，请完全退出应用后重新启动')
  }
}

export async function listNotes(): Promise<NoteRecord[]> {
  assertNotesApi()
  return window.stealth.listNotes()
}

export async function createNote(content: string): Promise<NoteRecord> {
  assertNotesApi()
  return window.stealth.createNote(content)
}

export async function updateNote(noteId: string, content: string): Promise<NoteRecord> {
  assertNotesApi()
  return window.stealth.updateNote(noteId, content)
}

export async function removeNote(noteId: string): Promise<void> {
  assertNotesApi()
  return window.stealth.removeNote(noteId)
}
