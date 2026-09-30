import { Plus } from 'lucide-react'
import { useState } from 'react'
import { STATUS_OPTIONS } from '../utils/format'
import TaskCard from './TaskCard'

const COLUMN_TONES = { pending: 'violet', in_progress: 'orange', completed: 'teal' }
const EMPTY_TEXT = {
  pending: 'Nothing to do. Add a task or drag one here.',
  in_progress: 'Drag a task here when you start it.',
  completed: 'Finished tasks land here.',
}

/**
 * To Do / In Progress / Done columns. Drag a card to another column, or use its status menu, to move it.
 * columns: { pending: [tasks], in_progress: [...], completed: [...] }
 * counts: how many tasks each status has in total (Done may show only the newest few)
 * footers: optional content under a column, e.g. { completed: <button>View all</button> }
 * Test ids: "task-board", "board-column-<status>", "board-count-<status>", "board-add-<status>", cards "task-<id>".
 */
export default function KanbanBoard({ columns, counts, footers = {}, busyTaskId, onMove, onToggle, onEdit, onDelete, onAdd }) {
  const [dragging, setDragging] = useState(null) // the task being dragged
  const [dropTarget, setDropTarget] = useState(null) // status of the column under the pointer

  function handleDragOver(event, status) {
    if (!dragging) return // something else (e.g. a file) is being dragged
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget(status)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null)
  }

  function handleDrop(event, status) {
    event.preventDefault()
    if (dragging && dragging.status !== status) onMove(dragging, status)
    setDragging(null)
    setDropTarget(null)
  }

  function dragPropsFor(task) {
    if (busyTaskId === task.id) return undefined
    return {
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(task.id))
        setDragging(task)
      },
      onDragEnd: () => {
        setDragging(null)
        setDropTarget(null)
      },
    }
  }

  return (
    <div id="task-board" className="kanban">
      {STATUS_OPTIONS.map(({ value: status, label }) => (
        <section
          key={status}
          id={`board-column-${status}`}
          className={`kanban-column${dropTarget === status ? ' is-drop-target' : ''}`}
          aria-labelledby={`board-title-${status}`}
          onDragOver={(event) => handleDragOver(event, status)}
          onDragLeave={handleDragLeave}
          onDrop={(event) => handleDrop(event, status)}
        >
          <header className="kanban-column-header">
            <span className={`kanban-dot tone-${COLUMN_TONES[status]}`} aria-hidden="true" />
            <h2 id={`board-title-${status}`} className="kanban-column-title">
              {label}
            </h2>
            <span id={`board-count-${status}`} className="kanban-count">
              {counts[status]}
            </span>
            <button
              id={`board-add-${status}`}
              type="button"
              className="icon-button icon-button-sm kanban-add"
              aria-label={`Add a task to ${label}`}
              title={`Add a task to ${label}`}
              onClick={() => onAdd(status)}
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </header>

          <div className="kanban-list">
            {columns[status].length === 0 ? (
              <p className="kanban-empty">{EMPTY_TEXT[status]}</p>
            ) : (
              columns[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  busy={busyTaskId === task.id}
                  className={dragging?.id === task.id ? 'is-dragging' : undefined}
                  dragProps={dragPropsFor(task)}
                  onToggle={onToggle}
                  onStatusChange={onMove}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
          {footers[status]}
        </section>
      ))}
    </div>
  )
}
