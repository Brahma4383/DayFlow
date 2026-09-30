/**
 * A circle that fills clockwise to `value` percent (0-100), with anything in the middle.
 * With a label it is announced as a progress bar (screen readers and tests can read aria-valuenow).
 * size is the largest width in pixels; on narrow screens the ring shrinks to fit.
 * tone: primary | success | warning | pink
 */
export default function ProgressRing({ id, value, size = 120, stroke = 10, tone = 'primary', label, className, children }) {
  const percent = Math.min(100, Math.max(0, value || 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  return (
    <div
      id={id}
      className={['ring', `ring-${tone}`, className].filter(Boolean).join(' ')}
      style={{ '--ring-size': `${size}px` }}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(percent) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={center} cy={center} r={radius} strokeWidth={stroke} />
        {percent > 0 && (
          <circle
            className="ring-fill"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
