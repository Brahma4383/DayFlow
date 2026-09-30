import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShowcase from '../components/AuthShowcase'
import Button from '../components/Button'
import Input from '../components/Input'
import Logo from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import { getErrorMessages } from '../services/errors'
import { findMissing, INVALID_EMAIL, isValidEmail, PASSWORDS_DIFFERENT } from '../utils/validation'

// Instant checks before calling the API (password strength is checked by the server)
function validate(form) {
  const errors = findMissing(form, ['name', 'email', 'password', 'confirm_password'])
  if (!errors.email && !isValidEmail(form.email)) {
    errors.email = INVALID_EMAIL
  }
  if (!errors.confirm_password && form.password !== form.confirm_password) {
    errors.confirm_password = PASSWORDS_DIFFERENT
  }
  return errors
}

export default function RegisterPage() {
  const { register } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
      await register(form)
      showToast('Account created. Welcome to DayFlow!')
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
          <h1 id="register-title" className="auth-title">
            Create your account
          </h1>
          <p className="auth-subtitle">Start planning your days with DayFlow. It&apos;s free.</p>

          {errors.general && (
            <p id="register-error" className="alert-error" role="alert">
              {errors.general}
            </p>
          )}

          <Input
            id="register-name"
            label="Name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
          <Input
            id="register-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            id="register-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Input
            id="register-confirm-password"
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
          />

          <Button id="register-submit" type="submit" block loading={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link id="login-link" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
