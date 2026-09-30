import { Check, Pin } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessages } from '../services/errors'
import { createNote, updateNote } from '../services/noteService'
import { NOTE_COLORS } from '../utils/notes'
import Button from './Button'
import Input from './Input'
import Modal from './Modal'

const MAX_TITLE = 200
const MAX_CONTENT = 10000
const EMPTY_MESSAGE = 'Write a title or some text first.'

/**
 * Add Note / Edit Note pop-up. Pass "note" to edit it, or leave it out to add a new one.
 * Calls onSaved(savedNote) after the server accepts it.
 * Test ids: "note-modal", "note-title", "note-content", "note-color-<colour>", "note-pinned", "note-cancel", "note-save".
 */
export default function NoteFormModal({ note, onClose, onSaved }) {
  const isEdit = Boolean(note)
  const [form, setForm] = useState(() => ({
    title: note?.title ?? '',
    content: note?.content ?? '',
    color: note?.color ?? 'default',
    pinned: note?.pinned ?? false,
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErrors((current) => ({ ...current, [name]: undefined, title: name === 'content' ? undefined : current.title }))
  }

  function chooseColor(color) {
    setForm({ ...form, color })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() && !form.content.trim()) {
      setErrors({ title: EMPTY_MESSAGE })
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const saved = isEdit ? await updateNote(note.id, form) : await createNote(form)
      onSaved(saved)
    } catch (error) {
      setErrors(getErrorMessages(error))
      setSaving(false)
    }
  }

  return (
    <Modal
      id="note-modal"
      open
      title={isEdit ? 'Edit Note' : 'New Note'}
      onClose={onClose}
      className={`note-modal note-${form.color}`}
      footer={
        <>
          <label className="note-pin-option">
            <input id="note-pinned" type="checkbox" name="pinned" className="check" checked={form.pinned} onChange={handleChange} />
            <Pin size={15} aria-hidden="true" />
            Pin to top
          </label>
          <Button id="note-cancel" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button id="note-save" type="submit" form="note-form" loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="note-form" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <p id="note-form-error" className="alert-error" role="alert">
            {errors.general}
          </p>
        )}
        <Input
          id="note-title"
          label="Title"
          name="title"
          placeholder="Title (optional)"
          maxLength={MAX_TITLE}
          value={form.title}
          onChange={handleChange}
          error={errors.title}
        />
        <Input
          id="note-content"
          label="Note"
          name="content"
          type="textarea"
          rows={8}
          placeholder="Write your note..."
          maxLength={MAX_CONTENT}
          value={form.content}
          onChange={handleChange}
          error={errors.content}
        />
        <div className="form-field">
          <span className="field-label" id="note-color-label">
            Colour
          </span>
          <div className="color-picker" role="radiogroup" aria-labelledby="note-color-label">
            {NOTE_COLORS.map((color) => {
              const selected = form.color === color.value
              return (
                <button
                  key={color.value}
                  id={`note-color-${color.value}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={color.label}
                  title={color.label}
                  className={`color-swatch note-${color.value}${selected ? ' is-selected' : ''}`}
                  onClick={() => chooseColor(color.value)}
                >
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          {errors.color && <p className="field-error">{errors.color}</p>}
        </div>
      </form>
    </Modal>
  )
}
