import { Compass } from 'lucide-react'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <div className="card not-found-card">
        <span className="empty-state-icon">
          <Compass size={28} aria-hidden="true" />
        </span>
        <h1 id="not-found-title">404</h1>
        <p>Sorry, this page does not exist.</p>
        <Button id="not-found-home-link" to="/dashboard">
          Go to Dashboard
        </Button>
      </div>
    </main>
  )
}
