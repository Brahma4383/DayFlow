// DayFlow logo: a tick in a rounded square, with the name next to it
export default function Logo({ className, showName = true }) {
  return (
    <span className={['logo', className].filter(Boolean).join(' ')}>
      <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" />
        <path d="M8.5 16.5l4.5 4.5 10.5-10.5" />
      </svg>
      {showName && <span className="logo-name">DayFlow</span>}
    </span>
  )
}
