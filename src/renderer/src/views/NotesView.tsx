import { useCallback, useEffect, useRef, useState } from 'react'
import type { NoteRecord } from '../../../preload/types'
import { groupNotesByDate } from '../lib/noteTime'
import { createNote as saveNote, listNotes, removeNote, updateNote } from '../lib/notesApi'
import NoteItem from '../components/notes/NoteItem'

export default function NotesView(): JSX.Element {
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [creating, setCreating] = useState(false)

  const refreshNotes = useCallback(async (): Promise<void> => {
    const next = await listNotes()
    setNotes(next)
  }, [])

  useEffect(() => {
    void refreshNotes()
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '笔记加载失败')
      })
      .finally(() => setLoading(false))
  }, [refreshNotes])

  const resizeComposer = useCallback(() => {
    const node = composerRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.max(72, node.scrollHeight)}px`
  }, [])

  useEffect(() => {
    resizeComposer()
  }, [draft, resizeComposer])

  const submitNote = async (): Promise<void> => {
    const content = draft.trim()
    if (!content || creating) return

    setCreating(true)
    setError('')
    try {
      await saveNote(content)
      setDraft('')
      await refreshNotes()
      composerRef.current?.focus()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '保存失败')
    } finally {
      setCreating(false)
    }
  }

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      void submitNote()
    }
  }

  const handleUpdate = async (noteId: string, content: string): Promise<void> => {
    setError('')
    try {
      await updateNote(noteId, content)
      await refreshNotes()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '更新失败')
      throw reason
    }
  }

  const handleRemove = async (noteId: string): Promise<void> => {
    setError('')
    try {
      await removeNote(noteId)
      await refreshNotes()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '删除失败')
    }
  }

  const groups = groupNotesByDate(notes)

  return (
    <div className="page page--notes">
      <div className="notes-card">
        <div className="notes-compose">
          <textarea
            ref={composerRef}
            className="notes-compose__input"
            value={draft}
            placeholder="写点什么…"
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
            onInput={resizeComposer}
            onKeyDown={handleComposerKeyDown}
          />
          <div className="notes-compose__footer">
            <span className="notes-compose__hint">Ctrl + Enter 保存</span>
            <button
              type="button"
              className="btn btn--accent notes-compose__submit"
              disabled={!draft.trim() || creating}
              onClick={() => void submitNote()}
            >
              {creating ? '保存中' : '记录'}
            </button>
          </div>
        </div>

        {error ? <p className="notes-status notes-status--error">{error}</p> : null}

        <div className="notes-body">
          {loading ? <p className="notes-status">加载中…</p> : null}

          {!loading && notes.length === 0 ? (
            <div className="notes-empty">
              <p>还没有小记</p>
              <span>在上方输入内容，随手记下灵感与待办</span>
            </div>
          ) : null}

          {!loading && groups.length > 0 ? (
            <div className="notes-timeline">
              {groups.map((group) => (
                <section key={group.label} className="notes-group">
                  <h3 className="notes-group__label">{group.label}</h3>
                  <div className="notes-group__list">
                    {group.notes.map((note) => (
                      <NoteItem key={note.id} note={note} onUpdate={handleUpdate} onRemove={handleRemove} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
