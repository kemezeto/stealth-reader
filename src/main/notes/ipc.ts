import { ipcMain } from 'electron'
import { createNote, listNotes, removeNote, updateNote } from './store'
import type { CreateNoteInput, UpdateNoteInput } from './types'

export function registerNotesIpc(): void {
  ipcMain.handle('notes-list', () => listNotes())

  ipcMain.handle('notes-create', (_event, input: CreateNoteInput) => createNote(input))

  ipcMain.handle('notes-update', (_event, noteId: string, input: UpdateNoteInput) =>
    updateNote(noteId, input)
  )

  ipcMain.handle('notes-remove', (_event, noteId: string) => {
    removeNote(noteId)
  })
}
