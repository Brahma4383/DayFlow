import { useEffect, useState } from 'react'
import * as authService from '../services/authService'
import { getToken, removeToken, saveToken } from '../services/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // If a token was saved earlier, check it with the server before showing any page
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => removeToken())
      .finally(() => setLoading(false))
  }, [])

  // Log this page out too when the token is gone:
  // - "pageshow" with persisted = true: the Back button restored an old copy of the page from memory
  // - "storage": the user logged out in another tab
  useEffect(() => {
    function logOutIfTokenGone() {
      if (!getToken()) setUser(null)
    }
    function handlePageShow(event) {
      if (event.persisted) logOutIfTokenGone()
    }
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('storage', logOutIfTokenGone)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('storage', logOutIfTokenGone)
    }
  }, [])

  async function login(email, password) {
    const data = await authService.login(email, password)
    saveToken(data.token)
    setUser(data.user)
  }

  async function register(form) {
    const data = await authService.register(form)
    saveToken(data.token)
    setUser(data.user)
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // Log out in the browser even if the server can't be reached
    } finally {
      removeToken()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
