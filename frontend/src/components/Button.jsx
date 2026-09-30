import { Link } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

/**
 * variant: primary | secondary | danger | success | ghost
 * size: "sm" for small buttons
 * loading: shows a spinner and disables the button
 * to: renders a link that looks like a button
 */
export default function Button({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  to,
  type = 'button',
  className,
  disabled,
  children,
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && <LoadingSpinner size="sm" label="" />}
      {children}
    </button>
  )
}
