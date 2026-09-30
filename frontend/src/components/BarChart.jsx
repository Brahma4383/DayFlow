import { niceMax, TICK_COUNT } from '../utils/chart'

/**
 * Column chart with one colour.
 * bars: [{ key, id, label, name, value, state }]
 *   label: text under the bar ("" to skip it when there are many bars)
 *   name: what the tooltip calls it, e.g. "Monday" or "28 Sept"
 *   value: the height; undefined leaves an empty slot (e.g. a day later this week)
 *   state: "today" highlights its label
 * max: top of the scale (default: a round number above the largest value)
 * labelMax: write the value above the tallest bar. Hover or keyboard-focus any bar to see its value.
 * Test ids: each bar's id, with its number in data-value.
 */
export default function BarChart({
  id,
  bars,
  max,
  formatValue = (value) => `${value}%`,
  formatTick,
  labelMax = true,
  height = 220,
  tone = 'primary',
}) {
  const values = bars.map((bar) => bar.value).filter((value) => value !== undefined)
  const largest = Math.max(0, ...values)
  const top = max ?? niceMax(largest)
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => (top / TICK_COUNT) * (TICK_COUNT - index))
  const tickText = formatTick ?? formatValue
  const percent = (value) => `${(Math.min(value, top) / top) * 100}%`
  const tallest = bars.find((bar) => bar.value === largest && largest > 0)

  return (
    <div id={id} className={`bar-chart bar-chart-${tone}`} style={{ '--chart-height': `${height}px` }}>
      <div className="bar-chart-y" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} style={{ bottom: percent(tick) }}>
            {tickText(Math.round(tick * 10) / 10)}
          </span>
        ))}
      </div>

      <div className="bar-chart-plot">
        {ticks.map((tick) => (
          <span key={tick} className={tick === 0 ? 'chart-baseline' : 'chart-gridline'} style={{ bottom: percent(tick) }} />
        ))}
        {bars.map((bar) => (
          <div key={bar.key} className="bar-slot">
            {bar.value !== undefined && (
              <div
                id={bar.id}
                className="bar-hit"
                tabIndex={0}
                role="img"
                aria-label={`${bar.name}: ${formatValue(bar.value)}`}
                data-value={bar.value}
              >
                {bar.value > 0 && <span className="bar" style={{ height: percent(bar.value) }} />}
                {labelMax && bar === tallest && (
                  <span className="bar-label" style={{ bottom: percent(bar.value) }}>
                    {formatValue(bar.value)}
                  </span>
                )}
                <span className="chart-tooltip bar-tooltip" style={{ bottom: percent(bar.value) }}>
                  <span className="chart-tooltip-title">{bar.name}</span>
                  <strong>{formatValue(bar.value)}</strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bar-chart-x" aria-hidden="true">
        {bars.map((bar) => {
          let className
          if (bar.state === 'today') className = 'is-today'
          else if (bar.value === undefined) className = 'is-upcoming'
          return (
            <span key={bar.key} className={className}>
              {bar.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
