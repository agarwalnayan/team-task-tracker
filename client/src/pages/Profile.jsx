import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'

const fieldClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-shadow'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

export default function Profile({ dark, setDark }) {
  const { user, updateProfile, updatePassword } = useAuth()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' })
  const [pwdSaving, setPwdSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setCompany(user.company || '')
    }
  }, [user])

  const handleProfile = async (e) => {
    e.preventDefault()
    setProfileMsg({ type: '', text: '' })
    setProfileSaving(true)
    try {
      await updateProfile({
        name: name.trim(),
        company: company.trim()
      })
      setProfileMsg({ type: 'ok', text: 'Profile saved successfully.' })
    } catch (err) {
      setProfileMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not save profile'
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setPwdMsg({ type: '', text: '' })
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'err', text: 'New passwords do not match.' })
      return
    }
    setPwdSaving(true)
    try {
      await updatePassword(currentPassword, newPassword)
      setPwdMsg({ type: 'ok', text: 'Password updated.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwdMsg({
        type: 'err',
        text: err.response?.data?.message || 'Could not update password'
      })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      title="Profile"
      subtitle="Update how you appear in TaskFlow and manage your password."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Your name and organization are visible to teammates.
          </p>
          <form onSubmit={handleProfile} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="profile-name">
                Display name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-company">
                Company / organization
              </label>
              <input
                id="profile-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={fieldClass}
                placeholder="Optional — used for teams and invitations"
                autoComplete="organization"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${fieldClass} opacity-70 cursor-not-allowed`}
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Email sign-in cannot be changed here. Contact support if you need to move your account.
              </p>
            </div>
            {profileMsg.text && (
              <p
                className={`text-sm ${profileMsg.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {profileMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 transition-colors"
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Security</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Change the password you use to sign in.</p>
          <form onSubmit={handlePassword} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="current-pw">
                Current password
              </label>
              <input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldClass}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="new-pw">
                New password
              </label>
              <input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
                minLength={6}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 6 characters.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="confirm-pw">
                Confirm new password
              </label>
              <input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            {pwdMsg.text && (
              <p
                className={`text-sm ${pwdMsg.type === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {pwdMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwdSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-900 dark:text-white text-sm font-semibold transition-colors"
            >
              {pwdSaving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
