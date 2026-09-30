import Button from './Button'
import Modal from './Modal'

// "Are you sure?" pop-up. Test ids: "<id>-message", "<id>-confirm", "<id>-cancel".
export default function ConfirmationModal({
  id = 'confirm-modal',
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal
      id={id}
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button id={`${id}-cancel`} variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button id={`${id}-confirm`} variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p id={`${id}-message`} className="confirm-message">
        {message}
      </p>
    </Modal>
  )
}
