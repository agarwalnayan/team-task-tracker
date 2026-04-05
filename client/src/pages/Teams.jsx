import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import { extractData } from '../utils/extractData'

const input =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500'
const label = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

function TeamInitial({ name }) {
  const ch = (name || 'T').charAt(0).toUpperCase()
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
      {ch}
    </div>
  )
}

export default function Teams({ dark, setDark }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamCompany, setTeamCompany] = useState('')
  const [inviteEmail, setInviteEmail] = useState({})
  const [inviteBusy, setInviteBusy] = useState({})

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams')
      setTeams(extractData(res))
    } catch {
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?._id) return
    fetchTeams()
  }, [user?._id])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const payload = { name: teamName.trim(), description: teamDescription.trim() || undefined }
      const c = teamCompany.trim()
      if (c) payload.company = c
      await api.post('/api/teams', payload)
      setTeamName('')
      setTeamDescription('')
      setTeamCompany('')
      fetchTeams()
    } catch (err) {
      setError(err.message || 'Could not create team')
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async (teamId) => {
    const email = (inviteEmail[teamId] || '').trim().toLowerCase()
    if (!email) return
    setInviteBusy((b) => ({ ...b, [teamId]: true }))
    setError('')
    try {
      await api.post(`/api/teams/${teamId}/members`, { email })
      setInviteEmail((m) => ({ ...m, [teamId]: '' }))
      fetchTeams()
    } catch (err) {
      setError(err.message || 'Could not add member')
    } finally {
      setInviteBusy((b) => ({ ...b, [teamId]: false }))
    }
  }

  const handleRemoveMember = async (teamId, memberUserId) => {
    if (!window.confirm('Remove this member from the team?')) return
    setError('')
    try {
      await api.delete(`/api/teams/${teamId}/members/${memberUserId}`)
      fetchTeams()
    } catch (err) {
      setError(err.message || 'Could not remove member')
    }
  }

  const isTeamAdmin = (team) =>
    team.members?.some(
      (m) =>
        String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
    )

  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      title="Teams"
      subtitle="Create workspaces, invite colleagues by email, and collaborate on tasks."
    >
      {user?.company && (
        <div className="mb-8 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
          <span className="font-semibold">Organization:</span> {user.company}. Teams you create use this label;
          invited users must match the team&apos;s company when both sides have one set.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-7">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">
                +
              </span>
              New team
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5">
              You can only assign tasks to people who share a team with you.
            </p>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className={label} htmlFor="new-team-name">
                  Team name
                </label>
                <input
                  id="new-team-name"
                  type="text"
                  placeholder="e.g. Product, Sales"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={input}
                  required
                />
              </div>
              <div>
                <label className={label} htmlFor="new-team-desc">
                  Description
                </label>
                <textarea
                  id="new-team-desc"
                  placeholder="What this team works on (optional)"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className={`${input} resize-none min-h-[88px]`}
                  rows={3}
                />
              </div>
              <div>
                <label className={label} htmlFor="new-team-company">
                  Company label
                </label>
                <input
                  id="new-team-company"
                  type="text"
                  placeholder={
                    user?.company
                      ? `Defaults to “${user.company}” if empty`
                      : 'Optional — for org boundaries'
                  }
                  value={teamCompany}
                  onChange={(e) => setTeamCompany(e.target.value)}
                  className={input}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-colors"
              >
                {creating ? 'Creating…' : 'Create team'}
              </button>
            </form>
          </section>
        </aside>

        <div className="lg:col-span-8 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your teams ({teams.length})
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-8 py-16 text-center">
              <p className="text-slate-700 dark:text-slate-300 font-medium">No teams yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Use the form on the left to create your first team, then invite teammates by their account email.
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {Array.isArray(teams) && teams.map((team) => (
                <li
                  key={team._id}
                  className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm overflow-hidden"
                >
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 items-start justify-between">
                    <div className="flex gap-4 min-w-0">
                      <TeamInitial name={team.name} />
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                          {team.name}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{team.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {team.company && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {team.company}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                            {team.members?.length || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-4 bg-slate-50/80 dark:bg-slate-800/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      Members
                    </p>
                    <ul className="space-y-2">
                      {team.members?.map((m) => {
                        const uid = m.user?._id || m.user
                        const memberUser = m.user
                        return (
                          <li
                            key={String(uid)}
                            className="flex items-center justify-between gap-3 py-2 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {(memberUser?.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {memberUser?.name || 'Member'}
                                  {m.role === 'admin' && (
                                    <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                                      Admin
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {memberUser?.email}
                                </p>
                              </div>
                            </div>
                            {isTeamAdmin(team) && String(uid) !== String(user?._id) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(team._id, uid)}
                                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline shrink-0"
                              >
                                Remove
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {isTeamAdmin(team) && (
                    <div className="p-5 sm:p-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Invite by email
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail[team._id] || ''}
                          onChange={(e) =>
                            setInviteEmail((prev) => ({ ...prev, [team._id]: e.target.value }))
                          }
                          className={`${input} sm:flex-1`}
                        />
                        <button
                          type="button"
                          disabled={inviteBusy[team._id]}
                          onClick={() => handleAddMember(team._id)}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                        >
                          {inviteBusy[team._id] ? 'Sending…' : 'Send invite'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        They must already have a TaskFlow account with this email.
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
