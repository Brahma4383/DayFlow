import { useSyncExternalStore } from 'react'

// Light or dark theme. index.html applies the saved choice before the page draws, so it never flashes.
const STORAGE_KEY = 'dayflow_theme'
const CHANGE_EVENT = 'dayflow-theme-change'

function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode); the theme still changes for this visit
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange) {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

// const [theme, toggleTheme] = useTheme()
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')]
}
