import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * Pop-up window. Closes with the X button, the Escape key, or a click outside it.
 * Test ids: "<id>", "<id>-title", "<id>-close".
 */
export default function Modal({ id = 'modal', open, title, onClose, children, footer, className }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  // Always call the newest onClose, without re-running the effect below on every render
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    // Put the cursor in the first field (or on the dialog if it has none)
    const firstField = dialogRef.current?.querySelector('input, select, textarea')
    ;(firstField ?? dialogRef.current)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div
        id={id}
        ref={dialogRef}
        className={['modal', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button id={`${id}-close`} type="button" className="icon-button modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
