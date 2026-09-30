import { CalendarDays, CircleCheck, ChartColumn, Flame, Plus, Repeat, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import BarChart from '../components/BarChart'
import Button from '../components/Button'
import ConfirmationModal from '../components/ConfirmationModal'
import EmptyState from '../components/EmptyState'
import HabitCard from '../components/HabitCard'
import HabitFormModal from '../components/HabitFormModal'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import MonthCalendar from '../components/MonthCalendar'
import Panel from '../components/Panel'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import StatCard from '../components/StatCard'
import { useToast } from '../context/useToast'
import { getErrorMessage, isNotFound } from '../services/errors'
import { deleteHabit, getHabitHistory, getHabits, setHabitCompleted } from '../services/habitService'
import {
  formatDate,
  formatShortDate,
  isHabitDone,
  monthKey,
  monthRange,
  parseISODate,
  todayISO,
  toISODate,
} from '../utils/format'

// Habits are few, so load them all at once (100 is the API's largest page)
const MAX_HABITS = 100
const HISTORY_DAYS = 30
const RANGES = [
  { value: 7, label: 'Week', id: 'habit-range-week' },
  { value: 30, label: 'Month', id: 'habit-range-month' },
]

function daysAgoISO(days) {
  const day = new Date()
  day.setDate(day.getDate() - days)
  return toISODate(day)
}

// 1 -> "1 day", 3 weeks -> "3 weeks"
function streakText(habit) {
  const unit = habit.streak_unit === 'weeks' ? 'week' : 'day'
  return `${habit.current_streak} ${unit}${habit.current_streak === 1 ? '' : 's'}`
}

// 0 = nothing ticked ... 4 = every habit ticked; used to colour the calendar
function heatLevel(day) {
  if (!day || day.total === 0) return null
  const share = day.done / day.total
  if (share === 0) return 0
  if (share >= 1) return 4
  return Math.min(3, Math.ceil(share * 3))
}

async function fetchHabitData() {
  const [habitPage, history] = await Promise.all([
    getHabits({ page_size: MAX_HABITS }),
    getHabitHistory(daysAgoISO(HISTORY_DAYS - 1), todayISO()),
  ])
  return { habits: habitPage.results, history }
}

export default function HabitsPage() {
  const showToast = useToast()
  const [habits, setHabits] = useState(null)
  const [history, setHistory] = useState([]) // last 30 days: [{ date, done, total }]
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [reloadCount, setReloadCount] = useState(0)
  const [busyHabitId, setBusyHabitId] = useState(null)
  const [habitForm, setHabitForm] = useState(null) // null = closed, { habit: null } = add, { habit } = edit
  const [deletingHabit, setDeletingHabit] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [range, setRange] = useState(7)
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const [monthHistory, setMonthHistory] = useState(null) // { month, days } for the calendar

  useEffect(() => {
    let ignore = false // skip results that arrive after leaving the page
    fetchHabitData()
      .then((data) => {
        if (ignore) return
        setHabits(data.habits)
        setHistory(data.history)
        setLoadError('')
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error))
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  // The calendar's month (it can show any month, not only the last 30 days)
  useEffect(() => {
    let ignore = false
    const [start, end] = monthRange(month)
    getHabitHistory(start, end)
      .then((days) => {
        if (!ignore) setMonthHistory({ month, days })
      })
      .catch(() => {
        if (!ignore) setMonthHistory({ month, days: [] }) // the calendar just shows no colours
      })
    return () => {
      ignore = true
    }
  }, [month, reloadCount])

  const reload = () => setReloadCount((count) => count + 1)

  async function handleToggle(habit) {
    const completed = !habit.completed_today
    setBusyHabitId(habit.id)
    try {
      const updated = await setHabitCompleted(habit.id, completed)
      setHabits((current) => current.map((h) => (h.id === updated.id ? updated : h)))
      showToast(completed ? 'Habit done for today. Keep it up!' : 'Habit marked as not done today.')
      reload() // today's square in the calendar and chart changes too
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) reload() // deleted somewhere else: refresh the list
    } finally {
      setBusyHabitId(null)
    }
  }

  function handleSaved() {
    const isEdit = Boolean(habitForm.habit)
    setHabitForm(null)
    showToast(isEdit ? 'Habit updated.' : 'Habit added.')
    reload()
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteHabit(deletingHabit.id)
      showToast('Habit deleted.')
      setDeletingHabit(null)
      reload()
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      if (isNotFound(error)) {
        setDeletingHabit(null) // already gone: close the question and refresh the list
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

  const openAddForm = () => setHabitForm({ habit: null })

  let content
  if (loadError) {
    content = <LoadError id="habits-error" retryId="habits-retry" what="your habits" message={loadError} onRetry={handleRetry} />
  } else if (habits === null) {
    content = <LoadingSpinner id="habits-loading" className="page-loading" />
  } else if (habits.length === 0) {
    content = (
      <EmptyState id="habits-empty" icon={Repeat} title="No habits yet" text="Add one small thing you want to do every day.">
        <Button id="add-first-habit" onClick={openAddForm}>
          <Plus size={17} aria-hidden="true" />
          Add Habit
        </Button>
      </EmptyState>
    )
  } else {
    const doneCount = habits.filter(isHabitDone).length
    const best = habits.reduce((top, habit) => (habit.current_streak > (top?.current_streak ?? 0) ? habit : top), null)
    const checkIns = history.reduce((sum, day) => sum + day.done, 0)
    const possible = history.reduce((sum, day) => sum + day.total, 0)
    const rate = possible > 0 ? Math.round((checkIns / possible) * 100) : 0
    const totalCheckIns = habits.reduce((sum, habit) => sum + habit.total_completions, 0)
    const chartDays = history.slice(-range)
    const calendarDays = monthHistory?.month === month ? monthHistory.days : []
    const byDate = Object.fromEntries(calendarDays.map((day) => [day.date, day]))

    content = (
      <>
        <div className="stat-grid">
          <div id="habits-summary" className="card stat-card">
            <div className="stat-top">
              <span className="stat-label">Done today</span>
              <span className="icon-tile icon-tile-lg tone-teal">
                <CircleCheck size={20} aria-hidden="true" />
              </span>
            </div>
            <span id="habits-today-value" className="stat-value">
              {doneCount}/{habits.length}
            </span>
            <ProgressBar
              id="habits-progress"
              label="Today's Habits"
              value={(doneCount / habits.length) * 100}
              valueText={`${doneCount} of ${habits.length} done`}
              variant="success"
            />
          </div>
          <StatCard
            id="habits-best-streak"
            label="Best current streak"
            value={best ? streakText(best) : '0 days'}
            hint={best ? best.name : 'Tick a habit today to start one'}
            icon={Flame}
            tone="orange"
          />
          <StatCard
            id="habits-rate"
            label="30-day completion"
            value={`${rate}%`}
            hint={`${checkIns} of ${possible} check-ins`}
            icon={Target}
            tone="violet"
            progress={rate}
          />
          <StatCard
            id="habits-total"
            label="Total check-ins"
            value={totalCheckIns}
            hint="since you started"
            icon={Repeat}
            tone="pink"
          />
        </div>

        <div className="dash-grid">
          <div className="span-8">
            <h2 className="section-title">Today&apos;s Habits</h2>
            <div id="habit-list" className="habit-grid">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  busy={busyHabitId === habit.id}
                  onToggle={handleToggle}
                  onEdit={(h) => setHabitForm({ habit: h })}
                  onDelete={setDeletingHabit}
                />
              ))}
            </div>
          </div>

          <div className="span-4 stack">
            <Panel id="habit-calendar-panel" title="Monthly overview" icon={CalendarDays} tone="teal">
              <MonthCalendar
                id="habit-calendar"
                month={month}
                onMonthChange={setMonth}
                compact
                getDayProps={(date) => {
                  const day = byDate[date]
                  const level = heatLevel(day)
                  if (level === null) return {}
                  const text = `${formatDate(date)}: ${day.done} of ${day.total} habits done`
                  return { className: `heat heat-${level}`, title: text, 'aria-label': text }
                }}
                footer={
                  <div className="heat-legend" aria-hidden="true">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                      <span key={level} className={`heat-swatch heat-${level}`} />
                    ))}
                    <span>More</span>
                  </div>
                }
              />
            </Panel>

            <Panel
              id="habit-progress-panel"
              title="Progress"
              subtitle="Habits done each day"
              icon={ChartColumn}
              action={<SegmentedControl label="Range" options={RANGES} value={range} onChange={setRange} />}
            >
              <BarChart
                id="habit-chart"
                tone="success"
                max={100}
                height={180}
                labelMax={false}
                bars={chartDays.map((day, index) => {
                  const date = parseISODate(day.date)
                  const showLabel = range === 7 || (chartDays.length - 1 - index) % 7 === 0
                  let label = ''
                  if (showLabel) label = range === 7 ? date.toLocaleDateString('en-IN', { weekday: 'short' }) : formatShortDate(day.date)
                  return {
                    key: day.date,
                    id: `habit-bar-${day.date}`,
                    label,
                    name: `${formatDate(day.date)} (${day.done} of ${day.total})`,
                    value: day.total > 0 ? Math.round((day.done / day.total) * 100) : 0,
                    state: day.date === todayISO() ? 'today' : undefined,
                  }
                })}
              />
            </Panel>
          </div>
        </div>
      </>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="habits-title">Habits</h1>
          <p className="page-subtitle">Build good habits, keep your streaks, and tick them off each day.</p>
        </div>
        <div className="page-actions">
          <Button id="add-habit-button" onClick={openAddForm}>
            <Plus size={17} aria-hidden="true" />
            Add Habit
          </Button>
        </div>
      </div>

      {content}

      {habitForm && <HabitFormModal habit={habitForm.habit} onClose={() => setHabitForm(null)} onSaved={handleSaved} />}

      <ConfirmationModal
        open={Boolean(deletingHabit)}
        title="Delete habit?"
        message={
          deletingHabit ? `Delete "${deletingHabit.name}"? Its history will be deleted too. This cannot be undone.` : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingHabit(null)}
      />
    </section>
  )
}
