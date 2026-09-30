// Spinning circle with an optional text. Without a label it is decorative (used inside buttons).
export default function LoadingSpinner({ label = 'Loading...', size = 'md', id, className }) {
  return (
    <span
      id={id}
      className={['spinner-wrapper', className].filter(Boolean).join(' ')}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className={`spinner spinner-${size}`} />
      {label && <span className="spinner-label">{label}</span>}
    </span>
  )
}
