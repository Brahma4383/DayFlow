import { useCallback, useRef, useState } from 'react'
import Toast from '../components/Toast'
import { ToastContext } from './ToastContext'

const MAX_TOASTS = 3

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = nextId.current++
    // Show at most 3 at a time so they don't cover the page; the oldest goes first
    setToasts((current) => [...current, { id, message, type }].slice(-MAX_TOASTS))
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast-container" className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Keeps onClose the same between renders, so each toast's timer is not restarted
function ToastItem({ toast, onRemove }) {
  const handleClose = useCallback(() => onRemove(toast.id), [onRemove, toast.id])
  return <Toast message={toast.message} type={toast.type} onClose={handleClose} />
}
