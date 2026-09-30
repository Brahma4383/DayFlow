import { WEEKDAYS } from '../utils/format'
import BarChart from './BarChart'

/**
 * Productivity score for each day from Monday to Sunday.
 * report: [{ date: "Monday", score: 80 }, ...] for the days so far; later days have no column yet.
 * Test ids: "weekly-chart", "chart-bar-<day>" (e.g. "chart-bar-monday") with a data-value attribute.
 */
export default function WeeklyChart({ report }) {
  const scores = Object.fromEntries(report.map((day) => [day.date, day.score]))
  const today = report.at(-1)?.date

  const bars = WEEKDAYS.map((day) => ({
    key: day,
    id: `chart-bar-${day.toLowerCase()}`,
    label: day.slice(0, 3),
    name: day,
    value: scores[day],
    state: day === today ? 'today' : undefined,
  }))

  return <BarChart id="weekly-chart" bars={bars} max={100} height={240} />
}
