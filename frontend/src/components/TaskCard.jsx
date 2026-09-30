import { isOverdue } from '../utils/format'
import Badge from './Badge'
import ItemActions from './ItemActions'
import { DueDate, PriorityBadge, StatusSelect, TaskCheckbox } from './TaskParts'

/**
 * One task as a card, used on the board and in the phone list.
 * busy disables the controls while the task is being saved. dragProps makes the card draggable on the board.
 * Test ids: "task-<id>", "task-<id>-title", "-checkbox", "-status", "-edit", "-delete".
 */
export default function TaskCard({ task, busy = false, onToggle, onStatusChange, onEdit, onDelete, dragProps, className }) {
  const done = task.status === 'completed'

  return (
    <article
      id={`task-${task.id}`}
      className={['task-card', `priority-${task.priority}`, done && 'task-done', busy && 'is-busy', className]
        .filter(Boolean)
        .join(' ')}
      {...dragProps}
    >
      <div className="task-card-top">
        <div className="badges">
          <PriorityBadge priority={task.priority} />
          {isOverdue(task) && <Badge variant="overdue">Overdue</Badge>}
        </div>
        <ItemActions
          idPrefix={`task-${task.id}`}
          name={task.title}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
        />
      </div>

      <div className="task-card-body">
        <TaskCheckbox task={task} onToggle={onToggle} disabled={busy} />
        <div className="task-card-text">
          <h3 id={`task-${task.id}-title`} className="task-title">
            {task.title}
          </h3>
          {task.description && <p className="task-description">{task.description}</p>}
        </div>
      </div>

      <div className="task-card-footer">
        <DueDate task={task} />
        <StatusSelect task={task} onChange={onStatusChange} disabled={busy} />
      </div>
    </article>
  )
}
