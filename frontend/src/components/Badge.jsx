// Small coloured label, e.g. <Badge variant="priority-high">High</Badge>
export default function Badge({ variant, children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
