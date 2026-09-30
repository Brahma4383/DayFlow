import { Plus } from 'lucide-react'
import { useState } from 'react'
import { formatDate, isOverdue } from '../utils/format'
import Modal from './Modal'
import MonthCalendar from './MonthCalendar'
import { PriorityBadge, StatusBadge } from './TaskParts'

const MAX_CHIPS = 3 // tasks written in a day; the rest open in a pop-up

function chipClass(task) {
  return ['cal-chip', `priority-${task.priority}`, task.status === 'completed' && 'is-done', isOverdue(task) && 'is-overdue']
    .filter(Boolean)
    .join(' ')
}

/**
 * Tasks placed on their due dates in a month grid. Click a task to edit it, or "+" to add one on that day.
 * On phones each day shows a count instead of titles; tapping it lists that day's tasks.
 * Test ids: "task-calendar", "calendar-add-<date>", "cal-task-<id>", "calendar-more-<date>", "day-modal".
 */
export default function TaskCalendar({ month, onMonthChange, tasks, onEdit, onAdd }) {
  const [openDay, setOpenDay] = useState(null) // date whose full list is shown

  const byDate = {}
  for (const task of tasks) {
    if (task.due_date) (byDate[task.due_date] ??= []).push(task)
  }
  const dayTasks = openDay ? (byDate[openDay] ?? []) : []

  function editFromList(task) {
    setOpenDay(null)
    onEdit(task)
  }

  return (
    <>
      <MonthCalendar
        id="task-calendar"
        month={month}
        onMonthChange={onMonthChange}
        getDayProps={(day) => ({ className: byDate[day] ? 'has-items' : undefined })}
        renderDay={(day) => {
          const list = byDate[day] ?? []
          const hidden = list.length - MAX_CHIPS
          return (
            <>
              <button
                id={`calendar-add-${day}`}
                type="button"
                className="cal-add"
                aria-label={`Add a task on ${formatDate(day)}`}
                onClick={() => onAdd(day)}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
              {list.length > 0 && (
                <>
                  <div className="cal-chips">
                    {list.slice(0, MAX_CHIPS).map((task) => (
                      <button
                        key={task.id}
                        id={`cal-task-${task.id}`}
                        type="button"
                        className={chipClass(task)}
                        title={task.title}
                        onClick={() => onEdit(task)}
                      >
                        {task.title}
                      </button>
                    ))}
                    {hidden > 0 && (
                      <button
                        id={`calendar-more-${day}`}
                        type="button"
                        className="cal-more"
                        onClick={() => setOpenDay(day)}
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="cal-count"
                    aria-label={`${list.length} ${list.length === 1 ? 'task' : 'tasks'} on ${formatDate(day)}`}
                    onClick={() => setOpenDay(day)}
                  >
                    {list.length}
                  </button>
                </>
              )}
            </>
          )
        }}
        footer={
          <div className="cal-legend" aria-hidden="true">
            <span className="cal-legend-item priority-high">High</span>
            <span className="cal-legend-item priority-medium">Medium</span>
            <span className="cal-legend-item priority-low">Low</span>
            <span className="cal-legend-item is-done">Done</span>
          </div>
        }
      />

      <Modal id="day-modal" open={Boolean(openDay)} title={openDay ? formatDate(openDay) : ''} onClose={() => setOpenDay(null)}>
        <ul className="day-task-list">
          {dayTasks.map((task) => (
            <li key={task.id}>
              <button
                id={`day-task-${task.id}`}
                type="button"
                className={`day-task${task.status === 'completed' ? ' task-done' : ''}`}
                onClick={() => editFromList(task)}
              >
                <span className="task-title">{task.title}</span>
                <span className="badges">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge task={task} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          id="day-modal-add"
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            const day = openDay
            setOpenDay(null)
            onAdd(day)
          }}
        >
          <Plus size={16} aria-hidden="true" /> Add a task on this day
        </button>
      </Modal>
    </>
  )
}
