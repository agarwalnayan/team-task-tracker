import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'text-sm font-medium px-3 py-2 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
const linkActive =
  'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-800/60'

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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-600/20 group-hover:shadow-lg group-hover:shadow-blue-600/25 transition-shadow">
                TF
              </span>
              <span className="font-semibold text-slate-900 dark:text-white tracking-tight hidden sm:inline">
                TaskFlow
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-0.5">
              <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Home
              </NavLink>
              <NavLink to="/teams" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Teams
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}>
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:flex items-center gap-2 mr-1 text-right">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                {(user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
            >
              {dark ? (
                <span className="text-lg leading-none" aria-hidden>
                  ☀
                </span>
              ) : (
                <span className="text-lg leading-none" aria-hidden>
                  ☽
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-red-600 dark:text-red-400 px-2.5 sm:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
