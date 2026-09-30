import ItemActions from './ItemActions'
import { DueDate, PriorityBadge, StatusSelect, TaskCheckbox } from './TaskParts'

// Tasks as table rows, with the same test ids as TaskCard (show one or the other, not both).
// busyTaskId disables that task's controls while it is being saved.
export default function TaskTable({ tasks, busyTaskId, onToggle, onStatusChange, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table id="task-table" className="task-table">
        <thead>
          <tr>
            <th scope="col" className="col-check">
              <span className="visually-hidden">Done</span>
            </th>
            <th scope="col">Task</th>
            <th scope="col">Priority</th>
            <th scope="col">Status</th>
            <th scope="col">Due date</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const busy = busyTaskId === task.id
            return (
              <tr key={task.id} id={`task-${task.id}`} className={task.status === 'completed' ? 'task-done' : undefined}>
                <td className="col-check">
                  <TaskCheckbox task={task} onToggle={onToggle} disabled={busy} />
                </td>
                <td>
                  <span id={`task-${task.id}-title`} className="task-title">
                    {task.title}
                  </span>
                  {task.description && <span className="task-description">{task.description}</span>}
                </td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <StatusSelect task={task} onChange={onStatusChange} disabled={busy} />
                </td>
                <td>
                  <DueDate task={task} />
                </td>
                <td>
                  <ItemActions
                    idPrefix={`task-${task.id}`}
                    name={task.title}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
