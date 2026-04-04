import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { isValidEmail } from '../utils/emailValidation'
import { getRequestError } from '../utils/requestError'

export default function Register({ dark, setDark }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register(trimmedName, trimmedEmail, password, company)
      navigate('/')
    } catch (err) {
      setError(getRequestError(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center px-4 py-12 font-sans antialiased">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.2),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.28),transparent)]"
        aria-hidden
      />
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors"
        >
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 mb-4">
            TF
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create account</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Join TaskFlow for your team</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-2xl shadow-black/20 dark:shadow-black/40 ring-1 ring-slate-200/50 dark:ring-slate-700/80">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm"
            >
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-email">
                Work email
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-company">
                Company (optional)
              </label>
              <input
                id="reg-company"
                type="text"
                autoComplete="organization"
                placeholder="Acme Inc"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Used for team boundaries and invitations.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-colors mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
