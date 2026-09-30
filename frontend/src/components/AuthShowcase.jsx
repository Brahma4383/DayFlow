import { ListChecks, Repeat, Timer } from 'lucide-react'
import Logo from './Logo'

const FEATURES = [
  { icon: ListChecks, title: 'Plan your tasks', text: 'Board, list and calendar views.' },
  { icon: Repeat, title: 'Build habits', text: 'Daily ticks, streaks and a monthly map.' },
  { icon: Timer, title: 'Focus deeply', text: 'Timed sessions that lift your score.' },
]

const PREVIEW_BARS = [48, 72, 60, 86, 78, 92, 66]

// The coloured half of the login and register pages (hidden on small screens)
export default function AuthShowcase() {
  return (
    <aside className="auth-showcase">
      <Logo className="logo-light" />
      <div className="auth-showcase-body">
        <h2 className="auth-showcase-title">Plan your day. Build habits. Stay in flow.</h2>
        <p className="auth-showcase-text">
          DayFlow brings your tasks, habits and focus time together, and scores every day out of 100.
        </p>

        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview-score">
            <span className="auth-preview-label">Today&apos;s score</span>
            <span className="auth-preview-value">86</span>
          </div>
          <div className="auth-preview-bars">
            {PREVIEW_BARS.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        <ul className="auth-features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="auth-feature-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="auth-showcase-footer">Your productivity, one day at a time.</p>
    </aside>
  )
}
