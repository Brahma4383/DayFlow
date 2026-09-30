import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthKey, monthRange, parseISODate, shiftMonth, toISODate, todayISO } from '../utils/format'

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Whole weeks (Monday to Sunday) that cover the month, as "YYYY-MM-DD"
function calendarDays(month) {
  const [first, last] = monthRange(month).map(parseISODate)
  const day = new Date(first)
  day.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // back to Monday
  const end = new Date(last)
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7))) // forward to Sunday

  const days = []
  while (day <= end) {
    days.push(toISODate(day))
    day.setDate(day.getDate() + 1)
  }
  return days
}

/**
 * Month grid starting on Monday, with previous / next / this month buttons.
 * month: "2026-09". renderDay(isoDate) returns extra content for each day of this month;
 * getDayProps(isoDate) can add a className, title or aria-label to that day.
 * Test ids: "<id>-title", "<id>-prev", "<id>-next", "<id>-today", "<id>-day-YYYY-MM-DD".
 */
export default function MonthCalendar({ id, month, onMonthChange, renderDay, getDayProps, compact = false, footer }) {
  const today = todayISO()
  const thisMonth = monthKey(new Date())
  const title = parseISODate(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div id={id} className={`month-cal${compact ? ' month-cal-compact' : ''}`}>
      <div className="month-cal-header">
        <h3 id={`${id}-title`} className="month-cal-title" aria-live="polite">
          {title}
        </h3>
        <div className="month-cal-nav">
          {month !== thisMonth && (
            <button id={`${id}-today`} type="button" className="btn btn-ghost btn-sm" onClick={() => onMonthChange(thisMonth)}>
              Today
            </button>
          )}
          <button
            id={`${id}-prev`}
            type="button"
            className="icon-button icon-button-sm"
            aria-label="Previous month"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            id={`${id}-next`}
            type="button"
            className="icon-button icon-button-sm"
            aria-label="Next month"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="month-cal-grid">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="month-cal-weekday" aria-hidden="true">
            {compact ? name.slice(0, 2) : name}
          </div>
        ))}
        {calendarDays(month).map((day) => {
          const inMonth = day.startsWith(month)
          const extra = inMonth && getDayProps ? getDayProps(day) : {}
          const className = [
            'month-cal-day',
            !inMonth && 'is-outside',
            day === today && 'is-today',
            day > today && 'is-future',
            extra.className,
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={day} id={`${id}-day-${day}`} {...extra} className={className}>
              <span className="month-cal-date">{Number(day.slice(8))}</span>
              {inMonth && renderDay?.(day)}
            </div>
          )
        })}
      </div>
      {footer}
    </div>
  )
}
