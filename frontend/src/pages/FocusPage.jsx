import { CircleCheck, CircleX, History, ListTodo, Play, Target, Timer, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import BarChart from '../components/BarChart'
import Button from '../components/Button'
import ConfirmationModal from '../components/ConfirmationModal'
import EmptyState from '../components/EmptyState'
import FocusTimer from '../components/FocusTimer'
import Input from '../components/Input'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import Panel from '../components/Panel'
import ProgressRing from '../components/ProgressRing'
import { useToast } from '../context/useToast'
import { getHistory } from '../services/dashboardService'
import { getErrorMessage, getErrorMessages } from '../services/errors'
import { cancelSession, completeSession, getActiveSession, getFocusHistory, startSession } from '../services/focusService'
import { getTasks } from '../services/taskService'
import { niceMax } from '../utils/chart'
import { formatDateTime, formatMinutes, formatSeconds, parseISODate, todayISO } from '../utils/format'
import { DURATION_RANGE } from '../utils/validation'

const DEFAULT_MINUTES = '25'
const PRESETS = [15, 25, 45, 60]
const FOCUS_GOAL_MINUTES = 100 // same goal as the productivity score
const RECENT_SESSIONS = 5

function minutesLabel(minutes) {
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}

// Whole minutes from 1 to 180, the same limits as the server
function isValidDuration(durationText) {
  const minutes = Number(durationText)
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 180
}

// "25" -> "25:00"; an invalid duration -> "--:--"
function previewTime(durationText) {
  return isValidDuration(durationText) ? formatSeconds(Number(durationText) * 60) : '--:--'
}

// Minutes per day for the last week and the newest sessions (shown beside the timer)
async function fetchFocusStats() {
  const [week, sessions] = await Promise.all([getHistory(7), getFocusHistory({ page_size: RECENT_SESSIONS })])
  return { week, sessions: sessions.results }
}

export default function FocusPage() {
  const showToast = useToast()
  const [view, setView] = useState('loading') // loading | setup | running | completed | error
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [session, setSession] = useState(null) // the running or just-completed session
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null) // { week, sessions }; null while loading or if it failed
  const [form, setForm] = useState({ task: '', duration: DEFAULT_MINUTES })
  const [errors, setErrors] = useState({})
  const [starting, setStarting] = useState(false)
  const [finishError, setFinishError] = useState('')
  const [confirmStop, setConfirmStop] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const [statsCount, setStatsCount] = useState(0) // bump to refresh the side panels

  // Load the tasks to choose from, and continue a session that is already running (e.g. after a refresh)
  useEffect(() => {
    let ignore = false
    Promise.all([getActiveSession(), getTasks({ status: 'pending,in_progress', ordering: 'due_date', page_size: 100 })])
      .then(([activeSession, taskPage]) => {
        if (ignore) return
        setTasks(taskPage.results)
        setForm((current) => ({ ...current, task: current.task || String(taskPage.results[0]?.id ?? '') }))
        setSession(activeSession)
        setView(activeSession ? 'running' : 'setup')
      })
      .catch((error) => {
        if (ignore) return
        setLoadError(getErrorMessage(error))
        setView('error')
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  useEffect(() => {
    let ignore = false
    fetchFocusStats()
      .then((data) => {
        if (!ignore) setStats(data)
      })
      .catch(() => {
        if (!ignore) setStats(null) // the timer still works without the side panels
      })
    return () => {
      ignore = true
    }
  }, [statsCount])

  const refreshStats = useCallback(() => setStatsCount((count) => count + 1), [])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
  }

  function choosePreset(minutes) {
    setForm({ ...form, duration: String(minutes) })
    setErrors((current) => ({ ...current, duration: undefined }))
  }

  async function handleStart(event) {
    event.preventDefault()
    if (!isValidDuration(form.duration)) {
      setErrors({ duration: DURATION_RANGE })
      return
    }
    setErrors({})
    setStarting(true)
    try {
      const started = await startSession({ task: Number(form.task), duration: Number(form.duration) })
      setSession(started)
      setFinishError('')
      setView('running')
    } catch (error) {
      setErrors(getErrorMessages(error))
    } finally {
      setStarting(false)
    }
  }

  // Called by the timer when it reaches 00:00
  const handleFinish = useCallback(async () => {
    setFinishError('')
    try {
      const completed = await completeSession()
      setSession(completed)
      setView('completed')
      showToast('Focus session completed!')
      refreshStats()
    } catch (error) {
      setFinishError(getErrorMessage(error))
    }
  }, [showToast, refreshStats])

  function handleRetry() {
    setView('loading')
    setReloadCount((count) => count + 1)
  }

  async function handleConfirmStop() {
    setStopping(true)
    try {
      await cancelSession()
      setConfirmStop(false)
      setSession(null)
      setView('setup')
      showToast('Focus session stopped.', 'info')
      refreshStats()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (error.response?.status === 400) {
        // The session already ended (e.g. in another tab): show what the server has now
        setConfirmStop(false)
        handleRetry()
      }
    } finally {
      setStopping(false)
    }
  }

  let content
  if (view === 'loading') {
    content = <LoadingSpinner id="focus-loading" className="page-loading" />
  } else if (view === 'error') {
    content = <LoadError id="focus-load-error" retryId="focus-retry" what="Focus Mode" message={loadError} onRetry={handleRetry} />
  } else if (view === 'running') {
    content = (
      <div className="card focus-card">
        <FocusTimer
          key={session.id}
          taskTitle={session.task_title}
          durationMinutes={session.duration}
          remainingSeconds={session.remaining_seconds}
          onFinish={handleFinish}
          onStop={() => setConfirmStop(true)}
        />
        {finishError && (
          <div id="focus-finish-error" className="alert-error focus-message" role="alert">
            <span>{finishError}</span>
            <Button id="focus-finish-retry" variant="secondary" size="sm" onClick={handleFinish}>
              Try again
            </Button>
          </div>
        )}
      </div>
    )
  } else if (view === 'completed') {
    content = (
      <div id="focus-completed" className="card focus-card focus-completed">
        <span className="focus-complete-icon">
          <CircleCheck size={44} aria-hidden="true" />
        </span>
        <h2 id="focus-completed-title" className="focus-completed-title">
          Focus Session Completed!
        </h2>
        <p id="focus-completed-duration">Duration: {minutesLabel(session.duration)}</p>
        {session.task_title && <p id="focus-completed-task">Task: {session.task_title}</p>}
        <div className="focus-actions">
          <Button id="back-to-dashboard" to="/dashboard" variant="secondary">
            Back to Dashboard
          </Button>
          <Button id="start-another" onClick={() => setView('setup')}>
            <Play size={16} aria-hidden="true" />
            Start another
          </Button>
        </div>
      </div>
    )
  } else if (tasks.length === 0) {
    content = (
      <div className="card focus-card">
        <EmptyState
          id="focus-no-tasks"
          icon={ListTodo}
          title="No open tasks"
          text="You have no pending tasks. Add a task first, then come back to focus on it."
        >
          <Button to="/tasks" variant="secondary">
            Go to Tasks
          </Button>
        </EmptyState>
      </div>
    )
  } else {
    content = (
      <form id="focus-setup" className="card focus-card focus-setup" onSubmit={handleStart} noValidate>
        <p className="eyebrow">Ready when you are</p>
        <ProgressRing value={0} size={240} stroke={14} className="focus-ring">
          <span id="focus-time" className="focus-time">
            {previewTime(form.duration)}
          </span>
          <span className="focus-ring-caption">minutes : seconds</span>
        </ProgressRing>

        {errors.general && (
          <p id="focus-error" className="alert-error" role="alert">
            {errors.general}
          </p>
        )}

        <div className="focus-fields">
          <Input
            id="focus-task"
            label="Task"
            name="task"
            options={tasks.map((task) => ({ value: String(task.id), label: task.title }))}
            value={form.task}
            onChange={handleChange}
            error={errors.task}
          />
          <div className="form-field">
            <span className="field-label" id="focus-presets-label">
              Duration
            </span>
            <div className="chip-row" role="group" aria-labelledby="focus-presets-label">
              {PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  id={`focus-preset-${minutes}`}
                  type="button"
                  className="chip"
                  aria-pressed={form.duration === String(minutes)}
                  onClick={() => choosePreset(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
          <Input
            id="focus-duration"
            label="Or type minutes (1-180)"
            name="duration"
            type="number"
            min={1}
            max={180}
            value={form.duration}
            onChange={handleChange}
            error={errors.duration}
          />
        </div>

        <Button id="focus-start-button" type="submit" loading={starting} className="focus-start">
          {!starting && <Play size={17} aria-hidden="true" />}
          Start
        </Button>
      </form>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="focus-title">Focus Mode</h1>
          <p className="page-subtitle">Pick a task and give it your full attention.</p>
        </div>
      </div>

      <div className="focus-layout">
        <div className="focus-main">{content}</div>
        <FocusSidebar stats={stats} />
      </div>

      <ConfirmationModal
        id="stop-modal"
        open={confirmStop}
        title="Stop this focus session?"
        message="A stopped session does not count toward your productivity score."
        confirmLabel="Stop session"
        loading={stopping}
        onConfirm={handleConfirmStop}
        onCancel={() => setConfirmStop(false)}
      />
    </section>
  )
}

// Today's goal, the last 7 days and recent sessions
function FocusSidebar({ stats }) {
  if (!stats) {
    return (
      <div className="focus-side">
        <div className="card panel">
          <LoadingSpinner id="focus-stats-loading" />
        </div>
      </div>
    )
  }

  const { week, sessions } = stats
  const todayMinutes = week.at(-1)?.focus_minutes ?? 0
  const weekTotal = week.reduce((sum, day) => sum + day.focus_minutes, 0)
  const largest = Math.max(...week.map((day) => day.focus_minutes))
  const left = Math.max(0, FOCUS_GOAL_MINUTES - todayMinutes)

  return (
    <div className="focus-side">
      <Panel id="focus-today" title="Today's goal" icon={Target} tone="orange">
        <div className="goal-row">
          <ProgressRing value={(todayMinutes / FOCUS_GOAL_MINUTES) * 100} size={112} stroke={11} tone="warning">
            <span id="focus-today-minutes" className="ring-value ring-value-sm">
              {todayMinutes}
            </span>
            <span className="ring-caption">min</span>
          </ProgressRing>
          <div className="goal-text">
            <p className="goal-title">{left > 0 ? `${left} min to go` : 'Goal reached!'}</p>
            <p className="goal-hint">Daily goal: {FOCUS_GOAL_MINUTES} minutes of completed focus.</p>
          </div>
        </div>
      </Panel>

      <Panel
        id="focus-week"
        title="Last 7 days"
        subtitle={`${formatMinutes(weekTotal)} in total · ${Math.round(weekTotal / 7)} min a day`}
        icon={TrendingUp}
        tone="violet"
      >
        <BarChart
          id="focus-week-chart"
          tone="warning"
          height={160}
          max={niceMax(largest, 60)}
          formatValue={(minutes) => `${minutes} min`}
          formatTick={(minutes) => `${minutes}`}
          bars={week.map((day) => ({
            key: day.date,
            id: `focus-bar-${day.date}`,
            label: parseISODate(day.date).toLocaleDateString('en-IN', { weekday: 'short' }),
            name: day.day,
            value: day.focus_minutes,
            state: day.date === todayISO() ? 'today' : undefined,
          }))}
        />
      </Panel>

      <Panel id="focus-sessions" title="Recent sessions" icon={History} tone="teal">
        {sessions.length === 0 ? (
          <EmptyState id="focus-sessions-empty" icon={Timer} text="Your focus sessions will appear here." compact />
        ) : (
          <ul className="session-list">
            {sessions.map((item) => {
              const done = item.status === 'completed'
              const Icon = done ? CircleCheck : item.status === 'running' ? Timer : CircleX
              return (
                <li key={item.id} id={`focus-session-${item.id}`} className={`session-item session-${item.status}`}>
                  <Icon size={18} className="session-icon" aria-hidden="true" />
                  <span className="session-text">
                    <span className="session-task">{item.task_title ?? 'Task deleted'}</span>
                    <span className="session-time">{formatDateTime(item.start_time)}</span>
                  </span>
                  <span className="session-duration">
                    {item.duration} min
                    <span className="visually-hidden">, {item.status}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
