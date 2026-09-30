import { Pencil, Trash2 } from 'lucide-react'

// Edit and Delete icon buttons for a task or habit. Test ids: "<idPrefix>-edit", "<idPrefix>-delete".
export default function ItemActions({ idPrefix, name, onEdit, onDelete }) {
  return (
    <div className="item-actions">
      <button
        id={`${idPrefix}-edit`}
        type="button"
        className="icon-button icon-button-sm"
        onClick={onEdit}
        aria-label={`Edit ${name}`}
        title="Edit"
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
      <button
        id={`${idPrefix}-delete`}
        type="button"
        className="icon-button icon-button-sm icon-button-danger"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
        title="Delete"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
