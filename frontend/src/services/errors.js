/**
 * Turns API errors into friendly messages, so users never see raw Django text.
 *
 * getErrorMessages(error) -> { field: "message", general: "message" } for forms
 * getErrorMessage(error)  -> one message, for toasts
 *
 * The API itself keeps Django's wording (Postman tests check it); only what users see changes here.
 */
import { DURATION_RANGE, fieldLabel, INVALID_EMAIL, requiredMessage } from '../utils/validation'

export const GENERIC_ERROR = 'Something went wrong. Please try again.'
export const NETWORK_ERROR = "Can't reach the server. Check your internet connection and try again."
export const SESSION_EXPIRED = 'Your session has expired. Please log in again.'
export const SERVER_ERROR = 'Something went wrong on our side. Please try again in a moment.'

// Friendlier wording for number ranges on specific fields
const RANGE_MESSAGES = {
  duration: DURATION_RANGE,
  target_days: 'Choose 1 to 6 days per week.',
}

// [Django / DRF message pattern, friendly message]
const FRIENDLY_MESSAGES = [
  [/^This field (is required|may not be blank|may not be null)\.$/, (field) => requiredMessage(field)],
  [/^Enter a valid email address\.$/, () => INVALID_EMAIL],
  [/^Date has wrong format/, () => 'Please enter a valid date.'],
  [/is not a valid choice\.$/, (field) => `Please choose a valid ${fieldLabel(field).toLowerCase()}.`],
  [/^A valid integer is required\.$/, (field) => RANGE_MESSAGES[field] ?? 'Please enter a whole number.'],
  [/^Ensure this value is greater than or equal to (\d+)\.$/, (field, n) => RANGE_MESSAGES[field] ?? `Must be at least ${n}.`],
  [/^Ensure this value is less than or equal to (\d+)\.$/, (field, n) => RANGE_MESSAGES[field] ?? `Must be ${n} or less.`],
  [/^Ensure this field has no more than (\d+) characters\.$/, (field, n) => `${fieldLabel(field)} must be ${n} characters or fewer.`],
  [/^Invalid pk .* object does not exist\.$/, (field) => `That ${fieldLabel(field).toLowerCase()} no longer exists. Please choose another.`],
  [/^This password is too short/, () => 'Password must be at least 8 characters long.'],
  [/^This password is too common\.$/, () => 'This password is too common. Please choose a stronger one.'],
  [/^This password is entirely numeric\.$/, () => 'Password cannot be only numbers.'],
  [/^The password is too similar to/, () => 'Password is too similar to your email or name.'],
  [/^Must be a valid boolean\.$/, () => GENERIC_ERROR],
]

function friendly(field, message) {
  for (const [pattern, toFriendly] of FRIENDLY_MESSAGES) {
    const match = message.match(pattern)
    if (match) return toFriendly(field, match[1])
  }
  return message // DayFlow's own API messages are already written for users
}

function notFoundMessage(url = '') {
  if (/\/tasks\/\d+\//.test(url)) return 'This task no longer exists. It may have been deleted.'
  if (/\/habits\/\d+\//.test(url)) return 'This habit no longer exists. It may have been deleted.'
  if (/\/notes\/\d+\//.test(url)) return 'This note no longer exists. It may have been deleted.'
  return "We couldn't find what you were looking for."
}

// A message decided by the kind of failure, or null for a normal 400 with field messages
function messageForStatus(error) {
  if (!error.response) return NETWORK_ERROR
  const { status } = error.response
  if (status === 401) return SESSION_EXPIRED
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return notFoundMessage(error.config?.url)
  if (status >= 500) return SERVER_ERROR
  return null
}

export function getErrorMessages(error) {
  const statusMessage = messageForStatus(error)
  if (statusMessage) return { general: statusMessage }

  const data = error.response.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { general: GENERIC_ERROR }
  }

  const messages = {}
  for (const [field, value] of Object.entries(data)) {
    const list = Array.isArray(value) ? value : [value]
    const text = [...new Set(list.map((message) => friendly(field, String(message))))].join(' ')
    if (field === 'non_field_errors' || field === 'detail') {
      messages.general = text
    } else {
      messages[field] = text
    }
  }
  return messages
}

export function getErrorMessage(error) {
  const messages = getErrorMessages(error)
  return messages.general ?? Object.values(messages)[0] ?? GENERIC_ERROR
}

export function isNotFound(error) {
  return error.response?.status === 404
}
