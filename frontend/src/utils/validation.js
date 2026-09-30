// Checks that forms run in the browser before calling the API, so obvious mistakes
// get an instant message. The server still checks everything again.

// Friendly names for API fields, used in messages like "Title is required."
const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  password: 'Password',
  confirm_password: 'Confirm password',
  title: 'Title',
  description: 'Description',
  priority: 'Priority',
  status: 'Status',
  due_date: 'Due date',
  frequency: 'Frequency',
  target_days: 'Days per week',
  task: 'Task',
  duration: 'Duration',
  content: 'Note',
  color: 'Colour',
}

export function fieldLabel(field) {
  return FIELD_LABELS[field] ?? 'This field'
}

export function requiredMessage(field) {
  return `${fieldLabel(field)} is required.`
}

// { field: "... is required." } for every empty field; {} when all are filled in
export function findMissing(form, fields) {
  const errors = {}
  for (const field of fields) {
    if (!String(form[field] ?? '').trim()) {
      errors[field] = requiredMessage(field)
    }
  }
  return errors
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export const INVALID_EMAIL = 'Please enter a valid email address.'
export const PASSWORDS_DIFFERENT = 'Passwords do not match.'
export const DURATION_RANGE = 'Duration must be between 1 and 180 minutes.'
