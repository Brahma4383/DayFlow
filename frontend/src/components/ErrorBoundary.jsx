import { Component } from 'react'
import Button from './Button'

/**
 * Catches unexpected errors while drawing the page and shows a friendly screen
 * instead of a blank one. (React only supports this in a class component.)
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('DayFlow crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="not-found" role="alert">
        <h1 id="app-error-title">Something went wrong</h1>
        <p>An unexpected problem stopped this page from loading. Reloading usually fixes it.</p>
        <Button id="app-error-reload" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </main>
    )
  }
}
