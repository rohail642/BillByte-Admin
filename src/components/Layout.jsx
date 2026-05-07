import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, Users, LogOut, ShieldCheck, Megaphone, Activity } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import logoText from '../assets/logo-text.png'

const nav = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/restaurants',    icon: UtensilsCrossed, label: 'Restaurants' },
  { to: '/users',          icon: Users,           label: 'Users' },
  { to: '/super-admins',   icon: ShieldCheck,     label: 'Super Admins' },
  { to: '/announcements',  icon: Megaphone,       label: 'Announcements' },
  { to: '/activity-log',   icon: Activity,        label: 'Activity Log' },
]

export default function Layout({ children }) {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col bg-surface border-r border-border"
        style={{ width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)' }}
      >
        {/* Brand */}
        <div className="flex flex-col items-start justify-center px-4 border-b border-border gap-0.5" style={{ height: 'var(--topbar-h)' }}>
          <img src={logoText} alt="BillByte" style={{ width: 100, mixBlendMode: 'multiply' }} />
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide leading-none">Admin Console</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-green-dim text-green font-semibold'
                    : 'text-text3 hover:bg-surface2 hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-green' : 'text-text3'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-green-dim flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={13} className="text-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-muted truncate">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-muted hover:text-red transition-colors p-1 rounded flex-shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
