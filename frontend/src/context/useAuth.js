import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Use in any component: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
