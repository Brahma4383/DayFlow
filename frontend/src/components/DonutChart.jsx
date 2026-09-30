import { useState } from 'react'

const GAP = 2 // pixels of background between two parts

/**
 * A ring split into parts, e.g. tasks by status. The legend lists every value and its share,
 * so reading it never depends on colour alone. Hover a part or a legend row to highlight it.
 * segments: [{ key, label, value, color }] where color is a CSS colour such as "var(--series-1)".
 * Test ids: "<id>-<key>" (legend row) and "<id>-<key>-value".
 */
export default function DonutChart({ id, segments, centerValue, centerLabel, size = 152, stroke = 18 }) {
  const [active, setActive] = useState(null)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const visible = segments.filter((segment) => segment.value > 0)
  const gap = visible.length > 1 ? GAP : 0

  // Each part starts where the parts before it end
  const lengths = visible.map((segment) => (segment.value / total) * circumference)
  const arcs = visible.map((segment, index) => ({
    ...segment,
    dash: Math.max(lengths[index] - gap, 0.5),
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  }))

  return (
    <div id={id} className="donut">
      <div className="donut-figure" style={{ '--ring-size': `${size}px` }}>
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className="donut-track" cx={center} cy={center} r={radius} strokeWidth={stroke} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              className={`donut-arc${active && active !== arc.key ? ' is-dimmed' : ''}`}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={stroke}
              stroke={arc.color}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${center} ${center})`}
              onMouseEnter={() => setActive(arc.key)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="donut-center">
          <span className="donut-center-value">{centerValue ?? total}</span>
          {centerLabel && <span className="donut-center-label">{centerLabel}</span>}
        </div>
      </div>

      <ul className="donut-legend">
        {segments.map((segment) => {
          const share = total > 0 ? Math.round((segment.value / total) * 100) : 0
          return (
            <li
              key={segment.key}
              id={`${id}-${segment.key}`}
              className={active === segment.key ? 'is-active' : undefined}
              onMouseEnter={() => setActive(segment.key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="legend-swatch" style={{ background: segment.color }} />
              <span className="donut-legend-label">{segment.label}</span>
              <span id={`${id}-${segment.key}-value`} className="donut-legend-value">
                {segment.value}
              </span>
              <span className="donut-legend-share">{share}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
