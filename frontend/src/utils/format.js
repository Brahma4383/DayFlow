// Labels and formatting shared by several components

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

// API values stay pending / in_progress / completed; the screen says To Do / In Progress / Done
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' },
]

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

// Weeks run Monday to Sunday, the same as the backend
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function getLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value
}

const pad = (n) => String(n).padStart(2, '0')

// "2026-09-28" -> a Date at local midnight. new Date("2026-09-28") would read it as UTC.
export function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// "2026-09-28" -> "28 Sept 2026"
export function formatDate(isoDate) {
  if (!isoDate) return 'No due date'
  return parseISODate(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "2026-09-28" -> "28 Sept"
export function formatShortDate(isoDate) {
  return parseISODate(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// A timestamp from the API -> "28 Sept, 10:30 am"
export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

// Today's date on this computer as "YYYY-MM-DD"
export function todayISO() {
  return toISODate(new Date())
}

export function isOverdue(task) {
  return task.status !== 'completed' && Boolean(task.due_date) && task.due_date < todayISO()
}

// Whole days from today to the date: 0 today, 1 tomorrow, -2 two days ago
export function daysFromToday(isoDate) {
  return Math.round((parseISODate(isoDate) - parseISODate(todayISO())) / 86400000)
}

// "2026-09-29" -> "Tomorrow"; a week away -> "In 7 days"; past -> "2 days ago"
export function formatDueRelative(isoDate) {
  if (!isoDate) return 'No due date'
  const days = daysFromToday(isoDate)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${days} days` : `${-days} days ago`
}

// A timestamp -> "just now", "5 min ago", "3 h ago", "Yesterday", "4 days ago" or "28 Sept"
export function formatTimeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`
  const days = -daysFromToday(toISODate(new Date(timestamp)))
  if (days <= 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatShortDate(toISODate(new Date(timestamp)))
}

// ---------- months (for calendars): "2026-09"
export function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number)
  return monthKey(new Date(year, number - 1 + delta, 1))
}

// "2026-09" -> ["2026-09-01", "2026-09-30"]
export function monthRange(month) {
  const [year, number] = month.split('-').map(Number)
  return [toISODate(new Date(year, number - 1, 1)), toISODate(new Date(year, number, 0))]
}

// ---------- habits
export function formatFrequency(habit) {
  if (habit.frequency === 'daily') return 'Every day'
  return `${habit.target_days} ${habit.target_days === 1 ? 'day' : 'days'} a week`
}

// A weekly habit that already reached its target this week
export function isWeeklyGoalMet(habit) {
  return habit.frequency === 'weekly' && habit.completions_this_week >= habit.target_days
}

// Same rule as the productivity score: done today, or a weekly habit whose goal is met
export function isHabitDone(habit) {
  return habit.completed_today || isWeeklyGoalMet(habit)
}

// 3, "days" -> "3-day streak"; 0 -> "No streak yet"
export function formatStreak(count, unit) {
  if (!count) return 'No streak yet'
  return `${count}-${unit === 'weeks' ? 'week' : 'day'} streak`
}

// ---------- numbers
// 1475 -> "24:35"
export function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

// 135 -> "2h 15m"; 45 -> "45m"
export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/**
 * Compare this period with the previous one for a stat card, e.g. { direction: 'up', text: '+3 vs last week' }.
 * higherIsGood: false for things like overdue tasks, where going up is bad.
 */
export function compareTrend(current, previous, comparedTo = 'last week', higherIsGood = true) {
  const change = current - previous
  if (change === 0) return { direction: 'flat', tone: 'neutral', text: `Same as ${comparedTo}` }
  const up = change > 0
  return {
    direction: up ? 'up' : 'down',
    tone: up === higherIsGood ? 'good' : 'bad',
    text: `${up ? '+' : '−'}${Math.abs(change)} vs ${comparedTo}`,
  }
}

// "Brahma Kumar" -> "BK"
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase()
}
