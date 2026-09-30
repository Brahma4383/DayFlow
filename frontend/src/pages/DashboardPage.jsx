import {
  ArrowRight,
  CalendarDays,
  ChartColumn,
  ChartPie,
  CircleCheck,
  Clock,
  Gauge,
  History,
  ListChecks,
  Repeat,
  SquareCheckBig,
  Timer,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import DonutChart from '../components/DonutChart'
import EmptyState from '../components/EmptyState'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import Panel from '../components/Panel'
import ProductivityCard from '../components/ProductivityCard'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import { PriorityBadge, TaskCheckbox } from '../components/TaskParts'
import TrendChart from '../components/TrendChart'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { getDashboardStats, getHistory, getOverview, getWeeklyReport } from '../services/dashboardService'
import { getErrorMessage, isNotFound } from '../services/errors'
import { getHabits, setHabitCompleted } from '../services/habitService'
import { getTasks, updateTask } from '../services/taskService'
import {
  compareTrend,
  formatDueRelative,
  formatShortDate,
  formatStreak,
  formatTimeAgo,
  isHabitDone,
  parseISODate,
  todayISO,
  WEEKDAYS,
} from '../utils/format'
import { habitIcon } from '../utils/habitIcon'

// Focus minutes that fill the focus bar (same goal as the productivity score)
const FOCUS_GOAL_MINUTES = 100
const TREND_DAYS = 14

const ACTIVITY_ICONS = { task: CircleCheck, focus: Timer, habit: Repeat }
const ACTIVITY_TONES = { task: 'violet', focus: 'orange', habit: 'teal' }

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function percent(part, whole) {
  return whole > 0 ? (part / whole) * 100 : 0
}

// The numbers that change when a task or habit is ticked
async function fetchNumbers() {
  const [stats, weeklyReport, overview, history] = await Promise.all([
    getDashboardStats(),
    getWeeklyReport(),
    getOverview(),
    getHistory(TREND_DAYS),
  ])
  return { stats, weeklyReport, overview, history }
}

// Everything the dashboard shows, fetched at the same time
async function fetchDashboardData() {
  const [numbers, tasksPage, habitsPage] = await Promise.all([
    fetchNumbers(),
    getTasks({ due_date: todayISO(), ordering: '-priority', page_size: 50 }),
    getHabits({ page_size: 100 }),
  ])
  return { ...numbers, todayTasks: tasksPage.results, habits: habitsPage.results }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const showToast = useToast()
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [data, setData] = useState(null)
  const [savingId, setSavingId] = useState(null) // "task-3" or "habit-2" while it is being saved
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let ignore = false // skip results that arrive after leaving the page
    fetchDashboardData()
      .then((result) => {
        if (ignore) return
        setData(result)
        setStatus('ready')
      })
      .catch((error) => {
        if (ignore) return
        setLoadError(getErrorMessage(error))
        setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  function handleRetry() {
    setStatus('loading')
    setReloadCount((count) => count + 1)
  }

  // Ticking something changes the numbers and today's score, so fetch them again
  async function refreshNumbers() {
    const numbers = await fetchNumbers()
    setData((current) => ({ ...current, ...numbers }))
  }

  async function handleToggleTask(task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    setSavingId(`task-${task.id}`)
    try {
      const updated = await updateTask(task.id, { status: newStatus })
      setData((current) => ({
        ...current,
        todayTasks: current.todayTasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
      await refreshNumbers()
      showToast(newStatus === 'completed' ? 'Task completed. Nice work!' : 'Task moved back to To Do.')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) setReloadCount((count) => count + 1) // deleted somewhere else: refresh
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggleHabit(habit) {
    const completed = !habit.completed_today
    setSavingId(`habit-${habit.id}`)
    try {
      const updated = await setHabitCompleted(habit.id, completed)
      setData((current) => ({
        ...current,
        habits: current.habits.map((h) => (h.id === updated.id ? updated : h)),
      }))
      await refreshNumbers()
      showToast(completed ? 'Habit done for today. Keep it up!' : 'Habit marked as not done today.')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) setReloadCount((count) => count + 1)
    } finally {
      setSavingId(null)
    }
  }

  const todayText = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section>
      <header className="page-header">
        <div>
          <h1 id="dashboard-title">
            {getGreeting()}, {user.name}!
          </h1>
          <p id="dashboard-date" className="page-subtitle">
            {todayText}
          </p>
        </div>
        <div className="page-actions">
          <Button id="dashboard-start-focus" to="/focus" variant="secondary">
            <Timer size={17} aria-hidden="true" />
            Start focus
          </Button>
        </div>
      </header>

      {status === 'loading' && <LoadingSpinner id="dashboard-loading" className="page-loading" />}

      {status === 'error' && (
        <LoadError
          id="dashboard-error"
          retryId="dashboard-retry"
          what="your dashboard"
          message={loadError}
          onRetry={handleRetry}
        />
      )}

      {status === 'ready' && (
        <DashboardContent
          data={data}
          savingId={savingId}
          onToggleTask={handleToggleTask}
          onToggleHabit={handleToggleHabit}
        />
      )}
    </section>
  )
}

function DashboardContent({ data, savingId, onToggleTask, onToggleHabit }) {
  const { stats, weeklyReport, overview, history, todayTasks, habits } = data
  const today = history.at(-1)
  const yesterday = history.at(-2) ?? today
  const trendAverage = Math.round(history.reduce((sum, day) => sum + day.productivity_score, 0) / history.length)

  return (
    <>
      <div className="stat-grid">
        <StatCard
          id="stat-tasks"
          label="Tasks done"
          value={`${stats.completed_tasks}/${stats.total_tasks}`}
          icon={SquareCheckBig}
          tone="violet"
          progress={percent(stats.completed_tasks, stats.total_tasks)}
          trend={compareTrend(overview.completed_this_week, overview.completed_last_week, 'last week')}
          hint={`${overview.completed_this_week} done this week`}
        />
        <StatCard
          id="stat-habits"
          label="Habits today"
          value={`${stats.completed_habits}/${stats.total_habits}`}
          icon={Repeat}
          tone="teal"
          progress={percent(stats.completed_habits, stats.total_habits)}
          progressVariant="success"
          trend={compareTrend(today.habits_done, yesterday.habits_done, 'yesterday')}
        />
        <StatCard
          id="stat-focus"
          label="Focus time"
          value={`${stats.focus_minutes} min`}
          icon={Timer}
          tone="orange"
          progress={percent(stats.focus_minutes, FOCUS_GOAL_MINUTES)}
          progressVariant="warning"
          trend={compareTrend(today.focus_minutes, yesterday.focus_minutes, 'yesterday')}
          hint={`goal ${FOCUS_GOAL_MINUTES} min`}
        />
        <StatCard
          id="stat-progress"
          label="Productivity"
          value={`${stats.productivity_score}%`}
          icon={Gauge}
          tone="pink"
          progress={stats.productivity_score}
          trend={compareTrend(today.productivity_score, yesterday.productivity_score, 'yesterday')}
        />
      </div>

      <div className="dash-grid">
        <Panel
          id="productivity-trend"
          className="span-8"
          title="Productivity trend"
          subtitle={`Daily score for the last ${TREND_DAYS} days · average ${trendAverage}%`}
          icon={TrendingUp}
          action={
            <Button id="trend-view-reports" to="/reports" variant="ghost" size="sm">
              Reports <ArrowRight size={15} aria-hidden="true" />
            </Button>
          }
        >
          <TrendChart
            id="trend-chart"
            labels={history.map((day) => ({
              short: formatShortDate(day.date),
              long: parseISODate(day.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              }),
            }))}
            series={[
              {
                key: 'score',
                label: 'Productivity score',
                color: 'var(--series-1)',
                values: history.map((day) => day.productivity_score),
              },
            ]}
            height={250}
          />
        </Panel>

        <div className="span-4">
          <ProductivityCard productivity={today} />
        </div>

        <Panel
          id="today-tasks-panel"
          className="span-4"
          title="Today's Tasks"
          subtitle={`${todayTasks.filter((t) => t.status === 'completed').length} of ${todayTasks.length} done`}
          icon={ListChecks}
          action={
            <Button id="view-all-tasks" to="/tasks" variant="ghost" size="sm">
              View all
            </Button>
          }
        >
          {todayTasks.length === 0 ? (
            <EmptyState id="today-tasks-empty" icon={CalendarDays} text="No tasks due today." compact>
              <Button to="/tasks" variant="secondary" size="sm">
                Plan a task
              </Button>
            </EmptyState>
          ) : (
            <ul id="today-tasks" className="check-list">
              {todayTasks.map((task) => (
                <li
                  key={task.id}
                  id={`today-task-${task.id}`}
                  className={`check-list-item${task.status === 'completed' ? ' task-done' : ''}`}
                >
                  <TaskCheckbox task={task} onToggle={onToggleTask} disabled={savingId === `task-${task.id}`} />
                  <label htmlFor={`task-${task.id}-checkbox`} className="task-title">
                    {task.title}
                  </label>
                  <PriorityBadge priority={task.priority} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="dashboard-habits"
          className="span-4"
          title="Habits"
          subtitle={`${habits.filter(isHabitDone).length} of ${habits.length} done today`}
          icon={Repeat}
          tone="teal"
          action={
            <Button id="view-all-habits" to="/habits" variant="ghost" size="sm">
              Manage
            </Button>
          }
        >
          {habits.length === 0 ? (
            <EmptyState id="dashboard-habits-empty" icon={Repeat} text="No habits yet." compact>
              <Button to="/habits" variant="secondary" size="sm">
                Add a habit
              </Button>
            </EmptyState>
          ) : (
            <ul className="check-list">
              {habits.map((habit) => {
                const { Icon, tone } = habitIcon(habit)
                const checkboxId = `dash-habit-${habit.id}-checkbox`
                return (
                  <li
                    key={habit.id}
                    id={`dash-habit-${habit.id}`}
                    className={`check-list-item${habit.completed_today ? ' habit-done' : ''}`}
                  >
                    <span className={`icon-tile icon-tile-sm tone-${tone}`}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <label htmlFor={checkboxId} className="check-list-text">
                      <span className="task-title">{habit.name}</span>
                      <span className="check-list-hint">{formatStreak(habit.current_streak, habit.streak_unit)}</span>
                    </label>
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="check habit-checkbox habit-checkbox-sm"
                      checked={habit.completed_today}
                      disabled={savingId === `habit-${habit.id}`}
                      onChange={() => onToggleHabit(habit)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel id="task-status" className="span-4" title="Tasks by status" icon={ChartPie} tone="blue">
          <DonutChart
            id="status-chart"
            segments={[
              { key: 'pending', label: 'To Do', value: overview.status.pending, color: 'var(--series-1)' },
              { key: 'in_progress', label: 'In Progress', value: overview.status.in_progress, color: 'var(--series-2)' },
              { key: 'completed', label: 'Done', value: overview.status.completed, color: 'var(--series-3)' },
            ]}
            centerLabel="tasks"
          />
          <div className="status-notes">
            <span id="overview-overdue" className={overview.overdue ? 'note-bad' : undefined}>
              <TriangleAlert size={15} aria-hidden="true" />
              {overview.overdue} overdue
            </span>
            <span id="overview-due-soon">
              <Clock size={15} aria-hidden="true" />
              {overview.due_soon} due in 3 days
            </span>
          </div>
        </Panel>

        <Panel
          id="weekly-progress"
          className="span-4"
          title="Weekly Progress"
          subtitle="Productivity score for each day"
          icon={ChartColumn}
          tone="orange"
          action={
            <Button id="view-reports" to="/reports" variant="ghost" size="sm">
              Reports
            </Button>
          }
        >
          <div className="progress-list">
            {WEEKDAYS.map((day, index) => {
              const report = weeklyReport[index] // only the days so far have a score
              if (!report) {
                return (
                  <div key={day} className="progress is-upcoming">
                    <div className="progress-header">
                      <span>{day}</span>
                      <span>—</span>
                    </div>
                    <div className="progress-track" />
                  </div>
                )
              }
              return <ProgressBar key={day} id={`weekly-${day.toLowerCase()}`} label={day} value={report.score} />
            })}
          </div>
        </Panel>

        <Panel id="upcoming-tasks" className="span-4" title="Upcoming" subtitle="Open tasks due soon" icon={CalendarDays} tone="pink">
          {overview.upcoming.length === 0 ? (
            <EmptyState id="upcoming-empty" icon={CalendarDays} text="Nothing due from today on." compact />
          ) : (
            <ul className="upcoming-list">
              {overview.upcoming.map((task) => {
                const due = parseISODate(task.due_date)
                return (
                  <li key={task.id} id={`upcoming-${task.id}`} className="upcoming-item">
                    <span className="date-block" aria-hidden="true">
                      <span className="date-block-day">{due.getDate()}</span>
                      <span className="date-block-month">
                        {due.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </span>
                    <span className="upcoming-text">
                      <Link to="/tasks" className="task-title">
                        {task.title}
                      </Link>
                      <span className="check-list-hint">{formatDueRelative(task.due_date)}</span>
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel id="recent-activity" className="span-4" title="Recent activity" icon={History} tone="teal">
          {overview.recent_activity.length === 0 ? (
            <EmptyState id="activity-empty" icon={History} text="Your finished tasks, habits and focus sessions appear here." compact />
          ) : (
            <ol className="activity-list">
              {overview.recent_activity.map((event) => {
                const Icon = ACTIVITY_ICONS[event.type]
                return (
                  <li key={`${event.type}-${event.time}-${event.text}`} className="activity-item">
                    <span className={`icon-tile icon-tile-sm tone-${ACTIVITY_TONES[event.type]}`}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="activity-text">{event.text}</span>
                    <time className="activity-time" dateTime={event.time}>
                      {formatTimeAgo(event.time)}
                    </time>
                  </li>
                )
              })}
            </ol>
          )}
        </Panel>
      </div>
    </>
  )
}
