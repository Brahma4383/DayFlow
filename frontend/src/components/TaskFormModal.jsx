import { useState } from 'react'
import { getErrorMessages } from '../services/errors'
import { createTask, updateTask } from '../services/taskService'
import { PRIORITY_OPTIONS, STATUS_OPTIONS, todayISO } from '../utils/format'
import { findMissing } from '../utils/validation'
import Button from './Button'
import Input from './Input'
import Modal from './Modal'

/**
 * Add Task / Edit Task pop-up. Pass "task" to edit it, or leave it out to add a new one.
 * A new task starts with initialStatus (e.g. from a board column) and initialDate (e.g. from the calendar).
 * Calls onSaved(savedTask) after the server accepts it. Messages from the server are shown under each field.
 * Test ids: "task-modal", "task-title", "task-description", "task-priority", "task-status", "task-due-date",
 * "task-cancel", "task-save".
 */
export default function TaskFormModal({ task, initialStatus = 'pending', initialDate, onClose, onSaved }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date ?? '',
        }
      : { title: '', description: '', priority: 'medium', status: initialStatus, due_date: initialDate ?? todayISO() },
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const problems = findMissing(form, ['title'])
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSaving(true)
    const fields = { ...form, due_date: form.due_date || null } // empty date means "no due date"
    try {
      const saved = isEdit ? await updateTask(task.id, fields) : await createTask(fields)
      onSaved(saved)
    } catch (error) {
      setErrors(getErrorMessages(error))
      setSaving(false)
    }
  }

  return (
    <Modal
      id="task-modal"
      open
      title={isEdit ? 'Edit Task' : 'Add Task'}
      onClose={onClose}
      footer={
        <>
          <Button id="task-cancel" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button id="task-save" type="submit" form="task-form" loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <p id="task-form-error" className="alert-error" role="alert">
            {errors.general}
          </p>
        )}
        <Input
          id="task-title"
          label="Task Title"
          name="title"
          maxLength={200}
          value={form.title}
          onChange={handleChange}
          error={errors.title}
        />
        <Input
          id="task-description"
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />
        <div className="form-row">
          <Input
            id="task-priority"
            label="Priority"
            name="priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={handleChange}
            error={errors.priority}
          />
          <Input
            id="task-status"
            label="Status"
            name="status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={handleChange}
            error={errors.status}
          />
        </div>
        <Input
          id="task-due-date"
          label="Due Date"
          name="due_date"
          type="date"
          value={form.due_date}
          onChange={handleChange}
          error={errors.due_date}
        />
      </form>
    </Modal>
  )
}
