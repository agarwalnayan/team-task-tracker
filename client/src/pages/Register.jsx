import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { isValidEmail } from '../utils/emailValidation'
import { validateEmail } from '../utils/emailVerification'
import { validateAndFormatPhone } from '../utils/phoneValidation'
import { getRequestError } from '../utils/requestError'

export default function Register({ dark, setDark }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('US')
  const [error, setError] = useState('')
  const [emailWarning, setEmailWarning] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setEmailWarning('')
    setError('')
    
    if (value && isValidEmail(value)) {
      const validation = validateEmail(value)
      if (validation.warning) {
        setEmailWarning(validation.warning)
      }
      if (!validation.isValid) {
        setEmailWarning(validation.error || 'Invalid email format')
      }
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    setPhone(value)
    setPhoneError('')
    setError('')
    
    if (value) {
      const validation = validateAndFormatPhone(value, phoneCountry)
      if (!validation.isValid) {
        setPhoneError(validation.error)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEmailWarning('')
    setPhoneError('')
    
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }
    
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).')
      return
    }
    
    if (trimmedPhone) {
      const phoneValidation = validateAndFormatPhone(trimmedPhone, phoneCountry)
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error)
        return
      }
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    
    setLoading(true)
    setVerifyingEmail(true)
    
    try {
      await register(trimmedName, trimmedEmail, password, company, trimmedPhone, phoneCountry)
      navigate('/')
    } catch (err) {
      setError(getRequestError(err, 'Registration failed'))
    } finally {
      setLoading(false)
      setVerifyingEmail(false)
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
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-xl border ${emailWarning ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'} text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                required
              />
              {emailWarning && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{emailWarning}</span>
                </div>
              )}
              {email && !emailWarning && isValidEmail(email) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Valid email format</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-phone">
                Phone number (optional)
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="appearance-none pl-10 pr-8 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                    >
                      <option value="US">🇺🇸 US</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="GB">🇬🇧 UK</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="CN">🇨🇳 China</option>
                      <option value="BR">🇧🇷 Brazil</option>
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-4 py-3 pl-12 rounded-xl border ${phoneError ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'} text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className={`w-5 h-5 ${phoneError ? 'text-red-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    {phone && !phoneError && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {phoneError && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{phoneError}</span>
                  </div>
                )}
                {phone && !phoneError && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Valid phone number format</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Used for team notifications and verification. International format supported.
                </p>
              </div>
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {verifyingEmail ? 'Verifying email…' : 'Creating account…'}
                </span>
              ) : (
                'Create account'
              )}
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
