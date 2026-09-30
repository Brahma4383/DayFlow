import { Flame, Trophy } from 'lucide-react'
import { formatFrequency, formatStreak, isWeeklyGoalMet } from '../utils/format'
import { habitIcon } from '../utils/habitIcon'
import Badge from './Badge'
import ItemActions from './ItemActions'
import ProgressBar from './ProgressBar'

/**
 * One habit with a big "done today" tick, its streak and its progress this week.
 * busy disables the tick while it is being saved.
 * Test ids: "habit-<id>", "-checkbox", "-name", "-streak", "-progress-value", "-edit", "-delete".
 */
export default function HabitCard({ habit, busy = false, onToggle, onEdit, onDelete }) {
  const done = habit.completed_today
  const checkboxId = `habit-${habit.id}-checkbox`
  const weekPercent = (habit.completions_this_week / habit.target_days) * 100
  const { Icon, tone } = habitIcon(habit)
  const unit = habit.streak_unit === 'weeks' ? 'wk' : 'd'

  return (
    <article id={`habit-${habit.id}`} className={`card habit-card${done ? ' habit-done' : ''}`}>
      <div className="habit-card-top">
        <span className={`icon-tile icon-tile-lg tone-${tone}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="habit-heading">
          <h3 id={`habit-${habit.id}-name`} className="habit-name">
            <label htmlFor={checkboxId}>{habit.name}</label>
          </h3>
          <div className="badges">
            <Badge variant="frequency">{formatFrequency(habit)}</Badge>
            {isWeeklyGoalMet(habit) && <Badge variant="status-completed">Weekly goal met</Badge>}
          </div>
        </div>
        <input
          id={checkboxId}
          type="checkbox"
          className="check habit-checkbox"
          checked={done}
          disabled={busy}
          onChange={() => onToggle(habit)}
          title={done ? 'Done today. Click to undo.' : 'Mark as done today'}
        />
      </div>

      {habit.description && <p className="habit-description">{habit.description}</p>}

      <ProgressBar
        id={`habit-${habit.id}-progress`}
        label="This week"
        value={weekPercent}
        valueText={`${habit.completions_this_week} / ${habit.target_days} days`}
        variant="success"
      />

      <div className="habit-card-footer">
        <span id={`habit-${habit.id}-streak`} className={`habit-streak${habit.current_streak ? ' is-active' : ''}`}>
          <Flame size={15} aria-hidden="true" />
          {formatStreak(habit.current_streak, habit.streak_unit)}
        </span>
        <span className="habit-best" title="Longest streak">
          <Trophy size={14} aria-hidden="true" />
          Best {habit.longest_streak}
          {unit}
        </span>
        <ItemActions
          idPrefix={`habit-${habit.id}`}
          name={habit.name}
          onEdit={() => onEdit(habit)}
          onDelete={() => onDelete(habit)}
        />
      </div>
    </article>
  )
}
