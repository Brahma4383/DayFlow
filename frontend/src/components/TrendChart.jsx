import { useId, useState } from 'react'
import { useElementWidth } from '../utils/useElementWidth'

const PAD = { top: 18, right: 18, bottom: 30, left: 40 }
const MIN_LABEL_GAP = 64 // pixels between two x-axis labels

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

// Smooth line through the points that never overshoots them (monotone cubic curve)
function smoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  const count = points.length
  const slopes = []
  for (let i = 0; i < count - 1; i++) {
    slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x))
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0]
    if (i === count - 1) return slopes[count - 2]
    if (slopes[i - 1] * slopes[i] <= 0) return 0
    const before = points[i].x - points[i - 1].x
    const after = points[i + 1].x - points[i].x
    return (3 * (before + after)) / ((2 * after + before) / slopes[i - 1] + (after + 2 * before) / slopes[i])
  })
  let path = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < count - 1; i++) {
    const third = (points[i + 1].x - points[i].x) / 3
    path += ` C${points[i].x + third},${points[i].y + tangents[i] * third}`
    path += ` ${points[i + 1].x - third},${points[i + 1].y - tangents[i + 1] * third}`
    path += ` ${points[i + 1].x},${points[i + 1].y}`
  }
  return path
}

/**
 * Line chart over time. One series also gets a soft area underneath; two or more get a legend.
 * labels: [{ short: "28 Sept", long: "Monday, 28 Sept" }], one per point
 * series: [{ key, label, color, values: [numbers] }]
 * Hover, or focus the chart and use the arrow keys, to read each point.
 */
export default function TrendChart({
  id,
  labels,
  series,
  height = 240,
  max = 100,
  ticks = [0, 25, 50, 75, 100],
  formatValue = (value) => `${value}%`,
  ariaLabel,
}) {
  const [containerRef, width] = useElementWidth()
  const [activeIndex, setActiveIndex] = useState(null)
  const gradientId = useId()

  const count = labels.length
  const plotWidth = Math.max(0, width - PAD.left - PAD.right)
  const plotHeight = height - PAD.top - PAD.bottom
  const baseline = PAD.top + plotHeight
  const x = (index) => PAD.left + (count > 1 ? (index / (count - 1)) * plotWidth : plotWidth / 2)
  const y = (value) => baseline - (clamp(value, 0, max) / max) * plotHeight
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(plotWidth / MIN_LABEL_GAP))))

  function moveTo(index) {
    setActiveIndex(clamp(index, 0, count - 1))
  }

  function handlePointerMove(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - box.left - PAD.left) / (plotWidth || 1)
    moveTo(Math.round(position * (count - 1)))
  }

  function handleKeyDown(event) {
    const current = activeIndex ?? count - 1
    const moves = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: count - 1 }
    if (event.key in moves) {
      event.preventDefault()
      moveTo(moves[event.key])
    } else if (event.key === 'Escape') {
      setActiveIndex(null)
    }
  }

  const active = activeIndex
  const tooltipLeft = active === null ? 0 : clamp(x(active), 80, Math.max(80, width - 80))
  const tooltipTop = active === null ? 0 : Math.min(...series.map((line) => y(line.values[active] ?? 0)))

  return (
    <div id={id} className="trend-chart">
      {series.length > 1 && (
        <ul className="chart-legend">
          {series.map((line) => (
            <li key={line.key}>
              <span className="legend-line" style={{ background: line.color }} />
              {line.label}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={containerRef}
        className="trend-plot"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={ariaLabel ?? `${series.map((line) => line.label).join(', ')}. Use the arrow keys to read each point.`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        onFocus={() => moveTo(count - 1)}
        onBlur={() => setActiveIndex(null)}
        onKeyDown={handleKeyDown}
      >
        {width > 0 && count > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={series[0].color} stopOpacity="0.22" />
                <stop offset="1" stopColor={series[0].color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  className={tick === 0 ? 'chart-baseline' : 'chart-gridline'}
                  x1={PAD.left}
                  x2={PAD.left + plotWidth}
                  y1={y(tick)}
                  y2={y(tick)}
                />
                <text className="chart-tick" x={PAD.left - 10} y={y(tick)} dy="0.32em" textAnchor="end">
                  {formatValue(tick)}
                </text>
              </g>
            ))}

            {labels.map((label, index) =>
              (count - 1 - index) % labelEvery === 0 ? (
                <text
                  key={label.long}
                  className={`chart-tick${index === active ? ' is-active' : ''}`}
                  x={x(index)}
                  y={baseline + 20}
                  textAnchor={index === count - 1 && count > 1 ? 'end' : 'middle'}
                >
                  {label.short}
                </text>
              ) : null,
            )}

            {series.map((line, seriesIndex) => {
              const points = line.values.map((value, index) => ({ x: x(index), y: y(value) }))
              const path = smoothPath(points)
              const last = points.at(-1)
              return (
                <g key={line.key}>
                  {series.length === 1 && (
                    <path
                      d={`${path} L${last.x},${baseline} L${points[0].x},${baseline} Z`}
                      fill={`url(#${gradientId})`}
                    />
                  )}
                  <path className="trend-line" d={path} stroke={line.color} />
                  <circle className="trend-dot" cx={last.x} cy={last.y} r="4" fill={line.color} />
                  {seriesIndex === 0 && active === null && (
                    <text className="chart-end-label" x={last.x - 8} y={last.y - 12} textAnchor="end">
                      {formatValue(line.values.at(-1))}
                    </text>
                  )}
                </g>
              )
            })}

            {active !== null && (
              <g>
                <line className="chart-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseline} />
                {series.map((line) => (
                  <circle
                    key={line.key}
                    className="trend-dot"
                    cx={x(active)}
                    cy={y(line.values[active] ?? 0)}
                    r="5"
                    fill={line.color}
                  />
                ))}
              </g>
            )}
          </svg>
        )}

        {active !== null && (
          <div className="chart-tooltip is-visible" style={{ left: tooltipLeft, top: tooltipTop }} aria-live="polite">
            <span className="chart-tooltip-title">{labels[active].long}</span>
            {series.map((line) => (
              <span key={line.key} className="chart-tooltip-row">
                {series.length > 1 && <span className="legend-line" style={{ background: line.color }} />}
                <span>{line.label}</span>
                <strong>{formatValue(line.values[active])}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
