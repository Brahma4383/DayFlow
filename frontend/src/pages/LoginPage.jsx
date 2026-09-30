import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShowcase from '../components/AuthShowcase'
import Button from '../components/Button'
import Input from '../components/Input'
import Logo from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { clearSessionExpired, wasSessionExpired } from '../services/api'
import { getErrorMessages, SESSION_EXPIRED } from '../services/errors'
import { findMissing, INVALID_EMAIL, isValidEmail } from '../utils/validation'

// Instant checks before calling the API
function validate(form) {
  const errors = findMissing(form, ['email', 'password'])
  if (!errors.email && !isValidEmail(form.email)) {
    errors.email = INVALID_EMAIL
  }
  return errors
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  // True when the user was sent here because their login stopped working
  const [sessionExpired] = useState(wasSessionExpired)

  useEffect(() => {
    clearSessionExpired() // show the notice only once
  }, [])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors((current) => ({ ...current, [event.target.name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const problems = validate(form)
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmitting(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(getErrorMessages(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <AuthShowcase />
      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <Logo className="auth-logo" />
          <h1 id="login-title" className="auth-title">
            Welcome back
          </h1>
          <p className="auth-subtitle">Log in to DayFlow to plan your day.</p>

          {sessionExpired && !errors.general && (
            <p id="login-info" className="alert-info" role="status">
              {SESSION_EXPIRED}
            </p>
          )}
          {errors.general && (
            <p id="login-error" className="alert-error" role="alert">
              {errors.general}
            </p>
          )}

          <Input
            id="login-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            id="login-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button id="login-submit" type="submit" block loading={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </Button>

          <p className="auth-switch">
            No account yet?{' '}
            <Link id="register-link" to="/register">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
