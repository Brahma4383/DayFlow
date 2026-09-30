import { CalendarDays, List, ListTodo, Plus, SquareKanban, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import ConfirmationModal from '../components/ConfirmationModal'
import EmptyState from '../components/EmptyState'
import FilterDropdown from '../components/FilterDropdown'
import KanbanBoard from '../components/KanbanBoard'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import SegmentedControl from '../components/SegmentedControl'
import TaskCalendar from '../components/TaskCalendar'
import TaskCard from '../components/TaskCard'
import TaskFormModal from '../components/TaskFormModal'
import TaskTable from '../components/TaskTable'
import { useToast } from '../context/useToast'
import { getErrorMessage, isNotFound } from '../services/errors'
import { deleteTask, getTasks, PAGE_SIZE, updateTask } from '../services/taskService'
import { monthKey, monthRange, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../utils/format'
import { useMediaQuery } from '../utils/useMediaQuery'

const NO_FILTERS = { search: '', priority: '', status: '' }
const VIEWS = [
  { value: 'board', label: 'Board', id: 'view-board', icon: SquareKanban },
  { value: 'list', label: 'List', id: 'view-list', icon: List },
  { value: 'calendar', label: 'Calendar', id: 'view-calendar', icon: CalendarDays },
]
const VIEW_KEY = 'dayflow_tasks_view' // remembers the last view in this browser
const MAX_TASKS = 100 // the API's largest page
const DONE_ON_BOARD = 6 // the Done column shows only the newest ones

const STATUS_MESSAGES = {
  pending: 'Task moved to To Do.',
  in_progress: 'Task moved to In Progress.',
  completed: 'Task completed. Nice work!',
}

function savedView() {
  try {
    const view = localStorage.getItem(VIEW_KEY)
    return VIEWS.some((option) => option.value === view) ? view : 'board'
  } catch {
    return 'board'
  }
}

// Load what the chosen view needs: the board wants open + done tasks, the list one page, the calendar one month
async function fetchTasks(view, filters, page, month) {
  const base = {}
  if (filters.search) base.search = filters.search
  if (filters.priority) base.priority = filters.priority

  if (view === 'board') {
    const [open, done] = await Promise.all([
      getTasks({ ...base, status: 'pending,in_progress', ordering: 'due_date', page_size: MAX_TASKS }),
      getTasks({ ...base, status: 'completed', ordering: '-due_date', page_size: DONE_ON_BOARD }),
    ])
    const columns = { pending: [], in_progress: [], completed: done.results }
    for (const task of open.results) columns[task.status].push(task)
    const counts = {
      pending: columns.pending.length,
      in_progress: columns.in_progress.length,
      completed: done.count,
    }
    return { view, columns, counts, total: open.count + done.count, openCount: open.count }
  }

  if (filters.status) base.status = filters.status
  if (view === 'calendar') {
    const [start, end] = monthRange(month)
    const tasks = await getTasks({ ...base, due_from: start, due_to: end, ordering: 'due_date', page_size: MAX_TASKS })
    return { view, month, tasks: tasks.results, total: tasks.count }
  }

  const taskPage = await getTasks({ ...base, page, page_size: PAGE_SIZE })
  return { view, taskPage, total: taskPage.count }
}

export default function TasksPage() {
  const showToast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isPhone = useMediaQuery('(max-width: 640px)') // phones get cards instead of a wide table
  // The top bar can open this page with a search or with the "New task" form open
  const [initial] = useState(() => location.state ?? {})
  const [view, setView] = useState(savedView)
  const [filters, setFilters] = useState({ ...NO_FILTERS, search: initial.search ?? '' })
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const [data, setData] = useState(null) // what fetchTasks returned for the current view
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [reloadCount, setReloadCount] = useState(0)
  const [busyTaskId, setBusyTaskId] = useState(null)
  const [moved, setMoved] = useState({}) // board moves shown before the server confirms them: { taskId: status }
  const [taskForm, setTaskForm] = useState(initial.openNew ? { task: null } : null) // null = closed
  const [deletingTask, setDeletingTask] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchBoxKey, setSearchBoxKey] = useState(0) // changing it empties the search box

  // Forget the top bar's request, so a page refresh does not open the form again
  useEffect(() => {
    const state = location.state
    if (state?.search !== undefined || state?.openNew) {
      navigate(location.pathname, { replace: true, state: { nonce: state.nonce } })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    let ignore = false // skip results that arrive after leaving the page or changing the view
    fetchTasks(view, filters, page, month)
      .then((result) => {
        if (ignore) return
        setData(result)
        setMoved({})
        setLoadError('')
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error))
      })
    return () => {
      ignore = true
    }
  }, [view, filters, page, month, reloadCount])

  const reload = () => setReloadCount((count) => count + 1)

  function changeView(newView) {
    setView(newView)
    try {
      localStorage.setItem(VIEW_KEY, newView)
    } catch {
      // Storage blocked: the view still changes for this visit
    }
  }

  const handleSearch = useCallback((search) => {
    setFilters((current) => ({ ...current, search }))
    setPage(1)
  }, [])

  function handleFilterChange(name, value) {
    setFilters({ ...filters, [name]: value })
    setPage(1)
  }

  function clearFilters() {
    setFilters(NO_FILTERS)
    setPage(1)
    setSearchBoxKey((key) => key + 1)
  }

  function showAllDone() {
    setFilters({ ...filters, status: 'completed' })
    setPage(1)
    changeView('list')
  }

  async function changeStatus(task, status) {
    if (task.status === status) return
    setBusyTaskId(task.id)
    setMoved((current) => ({ ...current, [task.id]: status }))
    try {
      await updateTask(task.id, { status })
      showToast(STATUS_MESSAGES[status])
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (!isNotFound(error)) setMoved((current) => ({ ...current, [task.id]: undefined }))
    } finally {
      setBusyTaskId(null)
      reload() // counts, order and filters may all change
    }
  }

  const handleToggle = (task) => changeStatus(task, task.status === 'completed' ? 'pending' : 'completed')

  function handleSaved() {
    const isEdit = Boolean(taskForm.task)
    setTaskForm(null)
    showToast(isEdit ? 'Task updated.' : 'Task added.')
    if (!isEdit && view === 'list' && page !== 1) {
      setPage(1) // new tasks are listed first
    } else {
      reload()
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteTask(deletingTask.id)
      showToast('Task deleted.')
      setDeletingTask(null)
      // Deleted the only task on the last page of the list: go back one page
      if (data?.view === 'list' && data.taskPage.results.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        reload()
      }
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) {
        setDeletingTask(null) // already gone: close the question and refresh the list
        reload()
      }
    } finally {
      setDeleting(false)
    }
  }

  function handleRetry() {
    setLoadError('')
    reload()
  }

  const openAddForm = (preset = {}) => setTaskForm({ task: null, ...preset })
  const hasFilters = Boolean(filters.search || filters.priority || (view !== 'board' && filters.status))
  const taskHandlers = {
    busyTaskId,
    onToggle: handleToggle,
    onEdit: (task) => setTaskForm({ task }),
    onDelete: setDeletingTask,
  }

  let content
  if (loadError) {
    content = <LoadError id="tasks-error" retryId="tasks-retry" what="your tasks" message={loadError} onRetry={handleRetry} />
  } else if (data === null || data.view !== view) {
    content = <LoadingSpinner id="tasks-loading" className="page-loading" />
  } else if (data.total === 0 && view !== 'calendar' && hasFilters) {
    content = (
      <EmptyState id="tasks-empty" title="No matching tasks" text="No tasks match your search or filters.">
        <Button id="clear-filters" variant="secondary" onClick={clearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    )
  } else if (data.total === 0 && view !== 'calendar') {
    content = (
      <EmptyState id="tasks-empty" icon={ListTodo} title="No tasks yet" text="Add your first task to plan your day.">
        <Button id="add-first-task" onClick={() => openAddForm()}>
          <Plus size={17} aria-hidden="true" />
          Add Task
        </Button>
      </EmptyState>
    )
  } else if (view === 'board') {
    // Show board moves at once; the next load replaces them with the server's answer
    const columns = { pending: [], in_progress: [], completed: [] }
    for (const task of Object.values(data.columns).flat()) {
      const status = moved[task.id] ?? task.status
      columns[status].push(status === task.status ? task : { ...task, status })
    }
    const counts = { ...data.counts }
    for (const [status, list] of Object.entries(columns)) {
      counts[status] += list.length - data.columns[status].length
    }
    const hiddenDone = data.counts.completed - data.columns.completed.length
    content = (
      <KanbanBoard
        columns={columns}
        counts={counts}
        onMove={changeStatus}
        onAdd={(status) => openAddForm({ status })}
        footers={{
          completed: hiddenDone > 0 && (
            <button id="board-view-done" type="button" className="kanban-more" onClick={showAllDone}>
              View all {data.counts.completed} done tasks
            </button>
          ),
        }}
        {...taskHandlers}
      />
    )
  } else if (view === 'calendar') {
    content = (
      <div className="card calendar-card">
        <TaskCalendar
          month={month}
          onMonthChange={setMonth}
          tasks={data.tasks}
          onEdit={taskHandlers.onEdit}
          onAdd={(dueDate) => openAddForm({ dueDate })}
        />
        {data.total > data.tasks.length && (
          <p className="list-count">
            Showing the first {data.tasks.length} of {data.total} tasks this month.
          </p>
        )}
      </div>
    )
  } else {
    const { taskPage } = data
    content = (
      <>
        <p id="task-count" className="list-count">
          {taskPage.count} {taskPage.count === 1 ? 'task' : 'tasks'}
        </p>
        {isPhone ? (
          <div className="card-grid">
            {taskPage.results.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyTaskId === task.id}
                onStatusChange={changeStatus}
                {...taskHandlers}
              />
            ))}
          </div>
        ) : (
          <TaskTable tasks={taskPage.results} onStatusChange={changeStatus} {...taskHandlers} />
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} count={taskPage.count} onPageChange={setPage} />
      </>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="tasks-title">Tasks</h1>
          <p className="page-subtitle">Plan your work, move it along, and finish it.</p>
        </div>
        <div className="page-actions">
          <Button id="add-task-button" onClick={() => openAddForm()}>
            <Plus size={17} aria-hidden="true" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="card toolbar">
        <SearchBar
          key={searchBoxKey}
          id="task-search"
          value={filters.search}
          onSearch={handleSearch}
          placeholder="Search tasks..."
        />
        <FilterDropdown
          id="filter-priority"
          label="Priority"
          value={filters.priority}
          options={PRIORITY_OPTIONS}
          onChange={(value) => handleFilterChange('priority', value)}
        />
        {view !== 'board' && (
          <FilterDropdown
            id="filter-status"
            label="Status"
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(value) => handleFilterChange('status', value)}
          />
        )}
        {hasFilters && (
          <Button id="toolbar-clear" variant="ghost" size="sm" className="toolbar-clear" onClick={clearFilters}>
            <X size={15} aria-hidden="true" />
            Clear
          </Button>
        )}
        <SegmentedControl label="View" options={VIEWS} value={view} onChange={changeView} className="toolbar-views" />
      </div>

      {content}

      {taskForm && (
        <TaskFormModal
          task={taskForm.task}
          initialStatus={taskForm.status}
          initialDate={taskForm.dueDate}
          onClose={() => setTaskForm(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmationModal
        open={Boolean(deletingTask)}
        title="Delete task?"
        message={deletingTask ? `Delete "${deletingTask.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </section>
  )
}
