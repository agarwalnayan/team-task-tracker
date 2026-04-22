import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const linkBase =
  'text-sm font-medium px-3 py-2 rounded-md transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
const linkActive =
  'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'

export default function AppLayout({
  children,
  dark,
  setDark,
  title,
  subtitle,
  backTo,
  backLabel
}) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                TF
              </span>
              <span className="font-semibold text-slate-900 dark:text-white text-sm hidden sm:inline">
                TaskFlow
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Dashboard
              </NavLink>
              <NavLink to="/teams" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Teams
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 mr-1 text-right">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                {(user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{user?.email}</p>
              </div>
            </div>
            <NotificationBell />
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              {dark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="sm:hidden flex gap-1 px-4 pb-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} whitespace-nowrap ${isActive ? linkActive : ''}`}>
            Home
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => `${linkBase} whitespace-nowrap ${isActive ? linkActive : ''}`}>
            Teams
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `${linkBase} whitespace-nowrap ${isActive ? linkActive : ''}`}>
            Profile
          </NavLink>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
          >
            <span aria-hidden>←</span> {backLabel || 'Back'}
          </Link>
        )}
        {(title || subtitle) && (
          <header className="mb-8 sm:mb-10">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1.5 text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl">{subtitle}</p>
            )}
          </header>
        )}
        {children}
      </main>
    </div>
  )
}
