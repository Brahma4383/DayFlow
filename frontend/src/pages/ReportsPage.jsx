import { CalendarDays, ChartColumn, ChartPie, Gauge, Table, Timer, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import Badge from '../components/Badge'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import Panel from '../components/Panel'
import ProductivityCard from '../components/ProductivityCard'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'
import WeeklyChart from '../components/WeeklyChart'
import { getHistory, getProductivity, getWeeklyReport } from '../services/dashboardService'
import { getErrorMessage } from '../services/errors'
import { formatMinutes, formatShortDate, parseISODate, WEEKDAYS } from '../utils/format'

const HISTORY_DAYS = 30
const RANGES = [
  { value: 'week', label: 'This week', id: 'report-range-week' },
  { value: 'month', label: 'Last 30 days', id: 'report-range-month' },
]

const average = (values) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0)

// "2026-09-28" -> "Mon, 28 Sept"
function dayLabel(isoDate) {
  return parseISODate(isoDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function ReportsPage() {
  const [report, setReport] = useState(null) // [{ date: "Monday", score: 80 }, ...] Monday to today
  const [history, setHistory] = useState([]) // the last 30 days with every number behind the score
  const [productivity, setProductivity] = useState(null)
  const [loadError, setLoadError] = useState('') // friendly message when loading failed
  const [reloadCount, setReloadCount] = useState(0)
  const [range, setRange] = useState('week')

  useEffect(() => {
    let ignore = false // skip results that arrive after leaving the page
    Promise.all([getWeeklyReport(), getProductivity(), getHistory(HISTORY_DAYS)])
      .then(([weeklyReport, todayProductivity, days]) => {
        if (ignore) return
        setReport(weeklyReport)
        setProductivity(todayProductivity)
        setHistory(days)
        setLoadError('')
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error))
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  function handleRetry() {
    setLoadError('')
    setReloadCount((count) => count + 1)
  }

  let content
  if (loadError) {
    content = <LoadError id="reports-error" retryId="reports-retry" what="your report" message={loadError} onRetry={handleRetry} />
  } else if (report === null) {
    content = <LoadingSpinner id="reports-loading" className="page-loading" />
  } else {
    // The days in the chosen range, with all their numbers (this week = Monday to today)
    const days = range === 'week' ? history.slice(-report.length) : history
    // Scores come from the same data as the chart, so the tiles always agree with it
    const scores =
      range === 'week'
        ? report.map((day) => ({ label: day.date, score: day.score }))
        : history.map((day) => ({ label: dayLabel(day.date), score: day.productivity_score }))
    const best = scores.reduce((top, day) => (day.score > (top?.score ?? 0) ? day : top), null)
    const rangeAverage = average(scores.map((day) => day.score))
    const focusTotal = days.reduce((sum, day) => sum + day.focus_minutes, 0)
    const rangeText = range === 'week' ? 'this week' : `the last ${HISTORY_DAYS} days`

    content = (
      <>
        <div className="stat-grid">
          <StatCard
            id="report-average"
            label={range === 'week' ? 'Weekly average' : '30-day average'}
            value={`${rangeAverage}%`}
            hint={`over ${scores.length} ${scores.length === 1 ? 'day' : 'days'}`}
            icon={Gauge}
            tone="violet"
            progress={rangeAverage}
          />
          <StatCard
            id="report-best"
            label="Best day"
            value={best ? best.label : '—'}
            hint={best ? `${best.score}% productivity` : `No activity ${rangeText}`}
            icon={Trophy}
            tone="orange"
          />
          <StatCard
            id="report-today"
            label="Today"
            value={`${productivity.productivity_score}%`}
            hint="productivity score"
            icon={CalendarDays}
            tone="pink"
            progress={productivity.productivity_score}
          />
          <StatCard
            id="report-focus"
            label="Focus time"
            value={formatMinutes(focusTotal)}
            hint={`completed ${rangeText}`}
            icon={Timer}
            tone="teal"
          />
        </div>

        <div className="dash-grid">
          <Panel
            id="report-chart"
            className="span-8"
            titleId="weekly-chart-title"
            title={range === 'week' ? 'Weekly Productivity' : 'Last 30 days'}
            subtitle={range === 'week' ? 'Score out of 100, Monday to Sunday' : 'Daily score out of 100'}
            icon={ChartColumn}
          >
            {range === 'week' ? (
              <WeeklyChart report={report} />
            ) : (
              <TrendChart
                id="monthly-chart"
                height={260}
                labels={history.map((day) => ({ short: formatShortDate(day.date), long: dayLabel(day.date) }))}
                series={[
                  {
                    key: 'score',
                    label: 'Productivity score',
                    color: 'var(--series-1)',
                    values: history.map((day) => day.productivity_score),
                  },
                ]}
              />
            )}
          </Panel>

          <div className="span-4">
            <ProductivityCard productivity={productivity} />
          </div>

          <Panel id="report-table-panel" className="span-7" title="Daily scores" icon={Table} tone="blue">
            {range === 'week' ? <WeekTable report={report} /> : <MonthTable days={history} />}
          </Panel>

          <Panel
            id="report-breakdown"
            className="span-5"
            title="Where your score comes from"
            subtitle={`Average of each part, ${rangeText}`}
            icon={ChartPie}
            tone="pink"
          >
            <div className="progress-list">
              <ProgressBar
                id="report-avg-tasks"
                label="Tasks done (50%)"
                value={average(days.map((day) => day.task_completion))}
              />
              <ProgressBar
                id="report-avg-habits"
                label="Habits done (30%)"
                value={average(days.map((day) => day.habit_completion))}
                variant="success"
              />
              <ProgressBar
                id="report-avg-focus"
                label="Focus score (20%)"
                value={average(days.map((day) => day.focus_score))}
                variant="warning"
              />
            </div>
            <dl className="breakdown-totals">
              <div>
                <dt>Tasks completed</dt>
                <dd id="report-tasks-completed">{days.reduce((sum, day) => sum + day.tasks_completed, 0)}</dd>
              </div>
              <div>
                <dt>Habit check-ins</dt>
                <dd id="report-habit-checkins">{days.reduce((sum, day) => sum + day.habits_done, 0)}</dd>
              </div>
              <div>
                <dt>Focus minutes</dt>
                <dd id="report-focus-minutes">{focusTotal}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="reports-title">Reports</h1>
          <p className="page-subtitle">See how your productivity changes from day to day.</p>
        </div>
        <div className="page-actions">
          <SegmentedControl label="Report range" options={RANGES} value={range} onChange={setRange} />
        </div>
      </div>
      {content}
    </section>
  )
}

// Monday to Sunday of this week; later days show "—"
function WeekTable({ report }) {
  const scores = Object.fromEntries(report.map((day) => [day.date, day.score]))
  const today = report.at(-1).date
  return (
    <div className="table-wrapper table-plain">
      <table id="weekly-table" className="data-table">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {WEEKDAYS.map((day) => {
            const key = day.toLowerCase()
            const score = scores[day]
            return (
              <tr key={day} id={`report-row-${key}`} className={score === undefined ? 'is-upcoming' : undefined}>
                <th scope="row">
                  {day} {day === today && <Badge variant="frequency">Today</Badge>}
                </th>
                <td id={`report-score-${key}`}>{score === undefined ? '—' : `${score}%`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Every day of the last 30, newest first, with the numbers behind the score
function MonthTable({ days }) {
  return (
    <div className="table-wrapper table-plain table-scroll">
      <table id="month-table" className="data-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Score</th>
            <th scope="col">Tasks</th>
            <th scope="col">Habits</th>
            <th scope="col">Focus</th>
          </tr>
        </thead>
        <tbody>
          {[...days].reverse().map((day) => (
            <tr key={day.date} id={`month-row-${day.date}`}>
              <th scope="row">{dayLabel(day.date)}</th>
              <td>{day.productivity_score}%</td>
              <td>
                {day.tasks_done}/{day.tasks_due}
              </td>
              <td>
                {day.habits_done}/{day.habits_total}
              </td>
              <td>{day.focus_minutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
