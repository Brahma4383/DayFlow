import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import ProgressBar from './ProgressBar'

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, flat: Minus }

/**
 * One number with an icon, e.g. "Tasks done 7/10".
 * trend: { direction, tone, text } from compareTrend(). progress (0-100) draws a thin bar under the number.
 * icon: a lucide icon component. tone: violet | pink | teal | orange | blue
 * Test ids: "<id>", "<id>-value" and "<id>-trend".
 */
export default function StatCard({ id, label, value, hint, icon: Icon, tone = 'violet', trend, progress, progressVariant }) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null

  return (
    <div id={id} className="card stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`icon-tile icon-tile-lg tone-${tone}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </div>
      <span id={`${id}-value`} className="stat-value">
        {value}
      </span>
      {progress !== undefined && <ProgressBar value={progress} variant={progressVariant} />}
      {(trend || hint) && (
        <div className="stat-bottom">
          {trend && (
            <span id={`${id}-trend`} className={`trend trend-${trend.tone}`}>
              <TrendIcon size={14} aria-hidden="true" />
              {trend.text}
            </span>
          )}
          {hint && <span className="stat-hint">{hint}</span>}
        </div>
      )}
    </div>
  )
}
