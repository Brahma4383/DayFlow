import { Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../utils/theme'
import Avatar from './Avatar'
import Button from './Button'

// True when the key press is meant for a text box, so shortcuts must not react to it
function isTyping(target) {
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Top bar: menu button (small screens), task search, "New task", light/dark switch and the user.
 * Searching or "New task" opens the Tasks page; the nonce makes it start fresh even if it is already open.
 * Press "/" anywhere to jump to the search box.
 * Test ids: "menu-button", "global-search", "quick-add-task", "theme-toggle", "navbar-user-name".
 */
export default function Navbar({ sidebarOpen, onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === '/' && !isTyping(event.target) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSearch(event) {
    event.preventDefault()
    navigate('/tasks', { state: { search: search.trim(), nonce: Date.now() } })
    setSearch('')
    searchRef.current?.blur()
  }

  const isDark = theme === 'dark'

  return (
    <header className="topbar">
      <button
        id="menu-button"
        type="button"
        className="icon-button menu-button"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-controls="sidebar"
        aria-expanded={sidebarOpen}
        onClick={onMenuClick}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <form className="topbar-search" role="search" onSubmit={handleSearch}>
        <Search size={17} className="topbar-search-icon" aria-hidden="true" />
        <input
          ref={searchRef}
          id="global-search"
          type="search"
          placeholder="Search tasks..."
          aria-label="Search tasks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <kbd className="topbar-search-key" aria-hidden="true">
          /
        </kbd>
      </form>

      <div className="topbar-actions">
        <Button
          id="quick-add-task"
          size="sm"
          className="topbar-add"
          aria-label="New task"
          onClick={() => navigate('/tasks', { state: { openNew: true, nonce: Date.now() } })}
        >
          <Plus size={17} aria-hidden="true" />
          <span className="topbar-add-text">New task</span>
        </Button>
        <button
          id="theme-toggle"
          type="button"
          className="icon-button"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Light theme' : 'Dark theme'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
        <Link to="/profile" className="user-chip" title="Your profile">
          <Avatar name={user.name} size="sm" />
          <span className="user-chip-text">
            <span id="navbar-user-name" className="user-chip-name">
              {user.name}
            </span>
            <span className="user-chip-email">{user.email}</span>
          </span>
        </Link>
      </div>
    </header>
  )
}
