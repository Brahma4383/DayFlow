import { CalendarDays, Flame, Mail, Moon, Palette, Repeat, SquareCheckBig, Sun, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import Avatar from '../components/Avatar'
import LoadError from '../components/LoadError'
import LoadingSpinner from '../components/LoadingSpinner'
import Panel from '../components/Panel'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/useAuth'
import { getDashboardStats, getHistory } from '../services/dashboardService'
import { getErrorMessage } from '../services/errors'
import { getHabits } from '../services/habitService'
import { formatMinutes } from '../utils/format'
import { useTheme } from '../utils/theme'

async function fetchProfileStats() {
  const [stats, history, habitPage] = await Promise.all([getDashboardStats(), getHistory(30), getHabits({ page_size: 100 })])
  return {
    completedTasks: stats.completed_tasks,
    totalTasks: stats.total_tasks,
    habits: habitPage.count,
    focusMinutes: history.reduce((sum, day) => sum + day.focus_minutes, 0),
    bestStreak: habitPage.results.reduce((best, habit) => Math.max(best, habit.longest_streak), 0),
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [theme, toggleTheme] = useTheme()
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let ignore = false
    fetchProfileStats()
      .then((data) => {
        if (ignore) return
        setStats(data)
        setLoadError('')
      })
      .catch((error) => {
        if (!ignore) setLoadError(getErrorMessage(error))
      })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  const joined = new Date(user.date_joined).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const isDark = theme === 'dark'

  let statsContent
  if (loadError) {
    statsContent = (
      <LoadError
        id="profile-stats-error"
        retryId="profile-stats-retry"
        what="your stats"
        message={loadError}
        onRetry={() => {
          setLoadError('')
          setReloadCount((count) => count + 1)
        }}
      />
    )
  } else if (stats === null) {
    statsContent = <LoadingSpinner id="profile-stats-loading" className="page-loading" />
  } else {
    statsContent = (
      <div className="stat-grid">
        <StatCard
          id="profile-stat-tasks"
          label="Tasks completed"
          value={stats.completedTasks}
          hint={`of ${stats.totalTasks} tasks`}
          icon={SquareCheckBig}
          tone="violet"
        />
        <StatCard id="profile-stat-habits" label="Habits tracked" value={stats.habits} icon={Repeat} tone="teal" />
        <StatCard
          id="profile-stat-focus"
          label="Focus time"
          value={formatMinutes(stats.focusMinutes)}
          hint="in the last 30 days"
          icon={Timer}
          tone="orange"
        />
        <StatCard
          id="profile-stat-streak"
          label="Longest streak"
          value={stats.bestStreak}
          hint="the best run of any habit"
          icon={Flame}
          tone="pink"
        />
      </div>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1 id="profile-title">Profile</h1>
          <p className="page-subtitle">Your account details and progress.</p>
        </div>
      </div>

      <div className="card profile-card">
        <div className="profile-banner" aria-hidden="true" />
        <div className="profile-main">
          <Avatar name={user.name} size="xl" />
          <div className="profile-identity">
            <h2 id="profile-name" className="profile-name">
              {user.name}
            </h2>
            <p className="profile-meta">DayFlow member</p>
          </div>
        </div>
        <dl className="profile-details">
          <div>
            <dt>
              <Mail size={15} aria-hidden="true" /> Email
            </dt>
            <dd id="profile-email">{user.email}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={15} aria-hidden="true" /> Member since
            </dt>
            <dd id="profile-joined">{joined}</dd>
          </div>
        </dl>
      </div>

      <h2 className="section-title">Your progress</h2>
      {statsContent}

      <Panel id="profile-preferences" title="Appearance" icon={Palette} tone="blue" className="profile-preferences">
        <div className="setting-row">
          <span className="setting-icon">{isDark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}</span>
          <span className="setting-text">
            <label htmlFor="profile-theme-toggle" className="setting-title">
              Dark mode
            </label>
            <span className="setting-hint">Easier on the eyes at night. Saved in this browser.</span>
          </span>
          <input
            id="profile-theme-toggle"
            type="checkbox"
            role="switch"
            className="switch"
            checked={isDark}
            onChange={toggleTheme}
          />
        </div>
      </Panel>
    </section>
  )
}
