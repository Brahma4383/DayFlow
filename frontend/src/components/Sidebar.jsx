import { ChartColumn, LayoutDashboard, ListTodo, LogOut, Repeat, StickyNote, Timer, User, Zap } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useToast } from '../context/useToast'
import Avatar from './Avatar'
import Logo from './Logo'

const MENU_LINKS = [
  { id: 'nav-dashboard', to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nav-tasks', to: '/tasks', label: 'Tasks', icon: ListTodo },
  { id: 'nav-habits', to: '/habits', label: 'Habits', icon: Repeat },
  { id: 'nav-focus', to: '/focus', label: 'Focus Mode', icon: Timer },
  { id: 'nav-reports', to: '/reports', label: 'Reports', icon: ChartColumn },
  { id: 'nav-notes', to: '/notes', label: 'Notes', icon: StickyNote },
]
const ACCOUNT_LINKS = [{ id: 'nav-profile', to: '/profile', label: 'Profile', icon: User }]

function SidebarLink({ link, onNavigate }) {
  const Icon = link.icon
  return (
    <NavLink id={link.id} to={link.to} className="sidebar-link" onClick={onNavigate}>
      <Icon size={19} aria-hidden="true" />
      <span>{link.label}</span>
    </NavLink>
  )
}

/**
 * Dark menu on the left: logo, page links, a focus shortcut, and the user with a Log out button.
 * Always visible on large screens; on phones and tablets it slides in when "open" is true.
 * Test ids: "sidebar", "nav-<page>", "sidebar-focus-cta", "logout-button".
 */
export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    showToast('You have been logged out.')
    navigate('/login', { replace: true })
  }

  return (
    <aside id="sidebar" className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <Link to="/dashboard" className="sidebar-brand" onClick={onNavigate} aria-label="DayFlow home">
        <Logo />
      </Link>

      <nav className="sidebar-nav" aria-label="Main">
        <p className="sidebar-section-label">Menu</p>
        {MENU_LINKS.map((link) => (
          <SidebarLink key={link.to} link={link} onNavigate={onNavigate} />
        ))}
        <p className="sidebar-section-label">Account</p>
        {ACCOUNT_LINKS.map((link) => (
          <SidebarLink key={link.to} link={link} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="sidebar-promo">
        <span className="sidebar-promo-icon">
          <Zap size={18} aria-hidden="true" />
        </span>
        <p className="sidebar-promo-title">Time for deep work?</p>
        <p className="sidebar-promo-text">Start a 25-minute focus session and lift today&apos;s score.</p>
        <Link id="sidebar-focus-cta" to="/focus" className="btn btn-sm sidebar-promo-button" onClick={onNavigate}>
          Start focusing
        </Link>
      </div>

      <div className="sidebar-footer">
        <Avatar name={user.name} />
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.name}</span>
          <span className="sidebar-user-email">{user.email}</span>
        </div>
        <button
          id="logout-button"
          type="button"
          className="icon-button sidebar-logout"
          aria-label="Log out"
          title="Log out"
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
