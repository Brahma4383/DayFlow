import { useState } from 'react'
import { getErrorMessages } from '../services/errors'
import { createHabit, updateHabit } from '../services/habitService'
import { FREQUENCY_OPTIONS } from '../utils/format'
import { findMissing } from '../utils/validation'
import Button from './Button'
import Input from './Input'
import Modal from './Modal'

// Weekly habits: 1 to 6 days a week (every day = a daily habit)
const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6].map((days) => ({
  value: String(days),
  label: `${days} ${days === 1 ? 'day' : 'days'} a week`,
}))

/**
 * Add Habit / Edit Habit pop-up. Pass "habit" to edit it, or leave it out to add a new one.
 * Test ids: "habit-modal", "habit-name", "habit-description", "habit-frequency", "habit-target-days",
 * "habit-cancel", "habit-save".
 */
export default function HabitFormModal({ habit, onClose, onSaved }) {
  const isEdit = Boolean(habit)
  const [form, setForm] = useState(() => ({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    frequency: habit?.frequency ?? 'daily',
    target_days: habit?.frequency === 'weekly' ? String(habit.target_days) : '3',
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const problems = findMissing(form, ['name'])
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSaving(true)
    const fields = {
      name: form.name,
      description: form.description,
      frequency: form.frequency,
      target_days: form.frequency === 'weekly' ? Number(form.target_days) : 7,
    }
    try {
      const saved = isEdit ? await updateHabit(habit.id, fields) : await createHabit(fields)
      onSaved(saved)
    } catch (error) {
      setErrors(getErrorMessages(error))
      setSaving(false)
    }
  }

  return (
    <Modal
      id="habit-modal"
      open
      title={isEdit ? 'Edit Habit' : 'Add Habit'}
      onClose={onClose}
      footer={
        <>
          <Button id="habit-cancel" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button id="habit-save" type="submit" form="habit-form" loading={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="habit-form" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <p id="habit-form-error" className="alert-error" role="alert">
            {errors.general}
          </p>
        )}
        <Input
          id="habit-name"
          label="Habit Name"
          name="name"
          maxLength={100}
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          id="habit-description"
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />
        <div className="form-row">
          <Input
            id="habit-frequency"
            label="Frequency"
            name="frequency"
            options={FREQUENCY_OPTIONS}
            value={form.frequency}
            onChange={handleChange}
            error={errors.frequency}
          />
          {form.frequency === 'weekly' && (
            <Input
              id="habit-target-days"
              label="Days per week"
              name="target_days"
              options={TARGET_OPTIONS}
              value={form.target_days}
              onChange={handleChange}
              error={errors.target_days}
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
