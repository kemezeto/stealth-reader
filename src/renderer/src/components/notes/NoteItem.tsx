import { useCallback, useEffect, useRef, useState } from 'react'
import type { NoteRecord } from '../../../preload/types'
import { formatNoteTime } from '../../lib/noteTime'

interface NoteItemProps {
  note: NoteRecord
  onUpdate: (noteId: string, content: string) => Promise<void>
  onRemove: (noteId: string) => Promise<void>
}

export default function NoteItem({ note, onUpdate, onRemove }: NoteItemProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.content)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) {
      setDraft(note.content)
    }
  }, [editing, note.content])

  const resizeTextarea = useCallback(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (!editing) return
    resizeTextarea()
  }, [draft, editing, resizeTextarea])

  const save = async (): Promise<void> => {
    const next = draft.trim()
    if (!next) {
      if (window.confirm('内容为空，是否删除这条笔记？')) {
        await onRemove(note.id)
      } else {
        setDraft(note.content)
        setEditing(false)
      }
      return
    }

    if (next === note.content) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      await onUpdate(note.id, next)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      void save()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(note.content)
      setEditing(false)
    }
  }

  return (
    <article className="note-item">
      <div className="note-item__meta">
        <time dateTime={new Date(note.updatedAt).toISOString()}>{formatNoteTime(note.updatedAt)}</time>
        <div className="note-item__actions">
          {editing ? (
            <button type="button" className="note-item__action" disabled={saving} onClick={() => void save()}>
              {saving ? '保存中' : '保存'}
            </button>
          ) : (
            <button type="button" className="note-item__action" onClick={() => setEditing(true)}>
              编辑
            </button>
          )}
          <button
            type="button"
            className="note-item__action note-item__action--danger"
            onClick={() => {
              if (window.confirm('确定删除这条笔记？')) {
                void onRemove(note.id)
              }
            }}
          >
            删除
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          className="note-item__editor"
          value={draft}
          rows={3}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onInput={resizeTextarea}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button type="button" className="note-item__body" onClick={() => setEditing(true)}>
          {note.content}
        </button>
      )}
    </article>
  )
}
