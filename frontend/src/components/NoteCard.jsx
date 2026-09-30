import { Pin, PinOff } from 'lucide-react'
import { formatTimeAgo } from '../utils/format'
import { noteName } from '../utils/notes'
import ItemActions from './ItemActions'

// A note that was never changed after being created (the two times differ by a few microseconds)
function isUnchanged(note) {
  return Math.abs(new Date(note.updated_at) - new Date(note.created_at)) < 1000
}

/**
 * One note as a coloured card. Click the card to open it for editing; the pin keeps it at the top.
 * busy disables the buttons while the note is being saved.
 * Test ids: "note-<id>", "note-<id>-title", "note-<id>-content", "note-<id>-pin", "note-<id>-edit", "note-<id>-delete".
 */
export default function NoteCard({ note, busy = false, onOpen, onTogglePin, onEdit, onDelete }) {
  const name = noteName(note)

  return (
    <article
      id={`note-${note.id}`}
      className={`note-card note-${note.color}${note.pinned ? ' is-pinned' : ''}${busy ? ' is-busy' : ''}`}
    >
      <button
        type="button"
        className="note-card-open"
        aria-label={`Open note "${name}"`}
        onClick={() => onOpen(note)}
      >
        {note.title && (
          <h3 id={`note-${note.id}-title`} className="note-title">
            {note.title}
          </h3>
        )}
        {note.content && (
          <p id={`note-${note.id}-content`} className="note-content">
            {note.content}
          </p>
        )}
      </button>

      <div className="note-card-footer">
        <time className="note-time" dateTime={note.updated_at} title={new Date(note.updated_at).toLocaleString('en-IN')}>
          {isUnchanged(note) ? 'Created' : 'Edited'} {formatTimeAgo(note.updated_at)}
        </time>
        <div className="note-actions">
          <button
            id={`note-${note.id}-pin`}
            type="button"
            className={`icon-button icon-button-sm note-pin${note.pinned ? ' is-on' : ''}`}
            aria-pressed={note.pinned}
            aria-label={note.pinned ? `Unpin "${name}"` : `Pin "${name}"`}
            title={note.pinned ? 'Unpin' : 'Pin to top'}
            disabled={busy}
            onClick={() => onTogglePin(note)}
          >
            {note.pinned ? <PinOff size={15} aria-hidden="true" /> : <Pin size={15} aria-hidden="true" />}
          </button>
          <ItemActions idPrefix={`note-${note.id}`} name={name} onEdit={() => onEdit(note)} onDelete={() => onDelete(note)} />
        </div>
      </div>
    </article>
  )
}
