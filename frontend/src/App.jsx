import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import { useAuth } from './context/useAuth'
import DashboardPage from './pages/DashboardPage'
import FocusPage from './pages/FocusPage'
import HabitsPage from './pages/HabitsPage'
import LoginPage from './pages/LoginPage'
import NotesPage from './pages/NotesPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import ReportsPage from './pages/ReportsPage'
import TasksPage from './pages/TasksPage'

// Pages inside this route need a logged-in user; others are sent to /login
function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner id="loading" className="page-loading" />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

// Login and register pages: a user who is already logged in goes to the dashboard
function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner id="loading" className="page-loading" />
  }
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

// The top bar's search and "New task" open the Tasks page with a new nonce each time.
// Using it as the key starts the page fresh, even when the Tasks page is already open.
function TasksRoute() {
  const location = useLocation()
  return <TasksPage key={location.state?.nonce ?? 'tasks'} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Only for logged-out users */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Only for logged-in users, shown with the navigation bar and sidebar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksRoute />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
