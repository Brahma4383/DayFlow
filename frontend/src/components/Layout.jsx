import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// Frame for every logged-in page: dark sidebar on the left, top bar, then the page itself
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)

  // Escape closes the sliding menu on small screens
  useEffect(() => {
    if (!sidebarOpen) return
    function handleKeyDown(event) {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
      <div className="app-main">
        <Navbar sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
