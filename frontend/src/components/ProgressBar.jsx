/**
 * Horizontal bar filled to "value" percent (0-100).
 * variant: primary | success | warning. valueText replaces the "NN%" text if given.
 */
export default function ProgressBar({ id, value, label, valueText, variant = 'primary' }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div className="progress">
      {label && (
        <div className="progress-header">
          <span>{label}</span>
          <span id={id ? `${id}-value` : undefined}>{valueText ?? `${percent}%`}</span>
        </div>
      )}
      <div
        id={id}
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`progress-fill progress-${variant}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
