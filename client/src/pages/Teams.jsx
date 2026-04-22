import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeams } from '../hooks/useTeams'
import AppLayout from '../components/AppLayout'
import JoinTeamByCode from '../components/JoinTeamByCode'
import api from '../utils/api'

// Generate consistent color for team avatar
function getTeamColor(name) {
  const colors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function TeamAvatar({ name, size = 'md' }) {
  const initial = (name || 'T').charAt(0).toUpperCase()
  const colorClass = getTeamColor(name || 'Team')
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${colorClass} rounded-xl flex items-center justify-center text-white font-semibold shadow-sm`}>
      {initial}
    </div>
  )
}

export default function Teams({ dark, setDark }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { teams, loading, refetch: fetchTeams } = useTeams()
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!teamName.trim()) return
    
    setCreating(true)
    setError('')
    try {
      const payload = { 
        name: teamName.trim(), 
        description: teamDescription.trim() || undefined 
      }
      await api.post('/api/teams', payload)
      setTeamName('')
      setTeamDescription('')
      setShowCreateForm(false)
      fetchTeams()
    } catch (err) {
      setError(err.message || 'Could not create team')
    } finally {
      setCreating(false)
    }
  }

  const getRoleBadge = (team) => {
    const isAdmin = team.members?.some(
      m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
    )
    const isCreator = String(team.createdBy?._id || team.createdBy) === String(user?._id)
    
    if (isCreator) return { text: 'Creator', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
    if (isAdmin) return { text: 'Admin', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
    return { text: 'Member', class: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
  }

  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      title="Teams"
      subtitle="Manage your teams and collaborate with colleagues"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Teams</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {loading ? 'Loading...' : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Team
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New Team</h3>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Team Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering, Marketing"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="What does this team work on?"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !teamName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join Team Section */}
      <div className="mb-8">
        <JoinTeamByCode onJoinSuccess={fetchTeams} />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No teams yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create your first team to start collaborating with colleagues
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const role = getRoleBadge(team)
            const memberCount = team.members?.length || 0
            
            return (
              <div
                key={team._id}
                onClick={() => navigate(`/teams/${team._id}`)}
                className="group p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <TeamAvatar name={team.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {team.name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                      {team.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${role.class}`}>
                        {role.text}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View details →
                  </span>
                  {team.company && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {team.company}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
