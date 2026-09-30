import { RotateCcw, TriangleAlert } from 'lucide-react'
import Button from './Button'

// Shown when a page's data could not be loaded. "what" completes "Could not load ___."
export default function LoadError({ id, retryId, what, message, onRetry }) {
  return (
    <div id={id} className="card empty-state load-error" role="alert">
      <span className="empty-state-icon">
        <TriangleAlert size={26} aria-hidden="true" />
      </span>
      <p className="load-error-title">Could not load {what}.</p>
      <p className="load-error-reason">{message}</p>
      <Button id={retryId} onClick={onRetry}>
        <RotateCcw size={16} aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
