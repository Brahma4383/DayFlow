// Small pieces shared by the task board, list and calendar, so a task looks the same everywhere
import { CalendarDays } from 'lucide-react'
import { formatDate, getLabel, isOverdue, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../utils/format'
import Badge from './Badge'

export function TaskCheckbox({ task, onToggle, disabled = false }) {
  const done = task.status === 'completed'
  return (
    <input
      id={`task-${task.id}-checkbox`}
      type="checkbox"
      className="check task-checkbox"
      checked={done}
      disabled={disabled}
      onChange={() => onToggle(task)}
      aria-label={done ? `Mark "${task.title}" as to do` : `Mark "${task.title}" as done`}
    />
  )
}

export function PriorityBadge({ priority }) {
  return <Badge variant={`priority-${priority}`}>{getLabel(PRIORITY_OPTIONS, priority)}</Badge>
}

export function StatusBadge({ task }) {
  if (isOverdue(task)) {
    return <Badge variant="overdue">Overdue</Badge>
  }
  return <Badge variant={`status-${task.status}`}>{getLabel(STATUS_OPTIONS, task.status)}</Badge>
}

// To Do / In Progress / Done menu. Test id: "task-<id>-status".
export function StatusSelect({ task, onChange, disabled = false }) {
  return (
    <select
      id={`task-${task.id}-status`}
      className={`status-select status-${task.status}`}
      value={task.status}
      disabled={disabled}
      aria-label={`Status of "${task.title}"`}
      onChange={(event) => onChange(task, event.target.value)}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Calendar icon + due date, in red when the task is late
export function DueDate({ task }) {
  return (
    <span className={`task-due${isOverdue(task) ? ' is-overdue' : ''}`}>
      <CalendarDays size={14} aria-hidden="true" />
      {formatDate(task.due_date)}
    </span>
  )
}
