import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect } from 'react'

const ICONS = { success: CircleCheck, error: TriangleAlert, info: Info }

// Short message in the corner that disappears after a few seconds. type: success | error | info
export default function Toast({ message, type = 'success', duration = 4000, onClose }) {
  const Icon = ICONS[type] ?? Info

  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" aria-label="Close message" onClick={onClose}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
