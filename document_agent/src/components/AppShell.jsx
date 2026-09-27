import { FileStack, LogOut, MessageSquare } from 'lucide-react'
import { useSelector } from 'react-redux'
import { NavLink, Outlet } from 'react-router-dom'

import { useCurrentUser, useLogout } from '../features/auth/authHooks'
import { selectCurrentUser } from '../features/auth/authSlice'

const NAV_ITEMS = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/documents', label: 'Documents', icon: FileStack },
]

export default function AppShell() {
  useCurrentUser()
  const user = useSelector(selectCurrentUser)
  const logout = useLogout()

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">
            Document Agent
          </span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user?.email ? (
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              {user.email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
