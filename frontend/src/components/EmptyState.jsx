import { Inbox } from 'lucide-react'

// Friendly message when a list has nothing to show, with an optional button (children)
export default function EmptyState({ id, icon: Icon = Inbox, title, text, compact = false, children }) {
  return (
    <div id={id} className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <span className="empty-state-icon">
        <Icon size={compact ? 20 : 26} aria-hidden="true" />
      </span>
      {title && <p className="empty-state-title">{title}</p>}
      {text && <p className="empty-state-text">{text}</p>}
      {children}
    </div>
  )
}
