import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { CreateNoteInput, NoteRecord, NotesLibrary, UpdateNoteInput } from './types'

function notesPath(): string {
  return join(app.getPath('userData'), 'notes.json')
}

function ensureUserDataDir(): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
}

function normalizeNote(raw: Partial<NoteRecord> & { id: string }): NoteRecord | null {
  if (typeof raw.content !== 'string') return null
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
  const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : createdAt
  return {
    id: raw.id,
    content: raw.content,
    createdAt,
    updatedAt
  }
}

function loadLibrary(): NotesLibrary {
  try {
    if (!existsSync(notesPath())) {
      return { notes: [] }
    }
    const parsed = JSON.parse(readFileSync(notesPath(), 'utf-8')) as NotesLibrary
    const notes = Array.isArray(parsed.notes)
      ? parsed.notes
          .map((note) => normalizeNote(note))
          .filter((note): note is NoteRecord => note !== null)
      : []
    return { notes }
  } catch {
    return { notes: [] }
  }
}

function saveLibrary(library: NotesLibrary): void {
  ensureUserDataDir()
  writeFileSync(notesPath(), JSON.stringify(library, null, 2), 'utf-8')
}

function sortNotes(notes: NoteRecord[]): NoteRecord[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function listNotes(): NoteRecord[] {
  return sortNotes(loadLibrary().notes)
}

export function createNote(input: CreateNoteInput): NoteRecord {
  const content = input.content.trim()
  if (!content) {
    throw new Error('笔记内容不能为空')
  }

  const now = Date.now()
  const note: NoteRecord = {
    id: randomUUID(),
    content,
    createdAt: now,
    updatedAt: now
  }

  const library = loadLibrary()
  library.notes.push(note)
  saveLibrary(library)
  return note
}

export function updateNote(noteId: string, input: UpdateNoteInput): NoteRecord {
  const content = input.content.trim()
  if (!content) {
    throw new Error('笔记内容不能为空')
  }

  const library = loadLibrary()
  const index = library.notes.findIndex((note) => note.id === noteId)
  if (index < 0) {
    throw new Error('笔记不存在')
  }

  const updated: NoteRecord = {
    ...library.notes[index],
    content,
    updatedAt: Date.now()
  }
  library.notes[index] = updated
  saveLibrary(library)
  return updated
}

export function removeNote(noteId: string): void {
  const library = loadLibrary()
  const nextNotes = library.notes.filter((note) => note.id !== noteId)
  if (nextNotes.length === library.notes.length) {
    throw new Error('笔记不存在')
  }
  saveLibrary({ notes: nextNotes })
}
