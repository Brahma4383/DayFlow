import { useContext } from 'react'
import { ToastContext } from './ToastContext'

// Use in any component: const showToast = useToast(); showToast('Task saved')
export function useToast() {
  return useContext(ToastContext)
}
