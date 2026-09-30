/**
 * A card with a heading row: icon, title, optional subtitle, and something on the right (e.g. a "View all" link).
 * Test ids: "<id>" and the title "<id>-title" (or titleId when given).
 * icon: a lucide icon component. tone: violet | pink | teal | orange | blue
 */
export default function Panel({ id, title, titleId, icon: Icon, tone = 'violet', subtitle, action, className, children }) {
  const headingId = titleId ?? (id ? `${id}-title` : undefined)

  return (
    <section id={id} className={['card panel', className].filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <header className="panel-header">
        {Icon && (
          <span className={`icon-tile tone-${tone}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        <div className="panel-heading">
          <h2 id={headingId} className="panel-title">
            {title}
          </h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="panel-action">{action}</div>}
      </header>
      {children}
    </section>
  )
}
