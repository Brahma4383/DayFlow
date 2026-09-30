import { initials } from '../utils/format'

// A circle with the user's initials, e.g. "BK". size: sm | md | lg
export default function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
