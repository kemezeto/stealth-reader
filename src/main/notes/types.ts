export interface NoteRecord {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface NotesLibrary {
  notes: NoteRecord[]
}

export interface CreateNoteInput {
  content: string
}

export interface UpdateNoteInput {
  content: string
}
