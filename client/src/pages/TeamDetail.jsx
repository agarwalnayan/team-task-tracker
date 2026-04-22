import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import { formatDistanceToNow, format } from 'date-fns'

// Team color helper
function getTeamColor(name) {
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500',
    'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function TeamDetail({ dark, setDark }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  console.log('TeamDetail component loaded!')
  console.log('Team ID from params:', id)
  console.log('Current user:', user)

  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Team Tasks & Conversations State
  const [teamTasks, setTeamTasks] = useState([])
  const [teamComments, setTeamComments] = useState([])
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' or 'conversations'
  const [tasksLoading, setTasksLoading] = useState(false)

  // Add validation
  if (!id) {
    console.error('No team ID provided')
    return (
      <AppLayout dark={dark} setDark={setDark}>
        <div className="text-center py-20">
          <p className="text-red-600 dark:text-red-400">No team ID provided</p>
          <Link to="/teams" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Teams
          </Link>
        </div>
      </AppLayout>
    )
  }

  // UI States
  const [showAddMember, setShowAddMember] = useState(false)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isTeamAdmin = team?.members?.some(
    m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
  ) || false

  const isTeamCreator = team ? String(team.createdBy?._id || team.createdBy) === String(user?._id) : false

  // Fetch team details
  const fetchTeam = async () => {
    if (!id) {
      console.error('Cannot fetch team: No ID provided')
      setError('No team ID provided')
      setLoading(false)
      return
    }

    console.log('Fetching team details for ID:', id)
    try {
      const response = await api.get(`/api/teams/${id}`)
      console.log('Team data received:', response)
      setTeam(response)
    } catch (err) {
      console.error('Error fetching team:', err)
      setError(err.message || 'Failed to fetch team details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchTeam()
      fetchTeamTasks()
      fetchTeamComments()
    }
  }, [id])

  // Fetch all tasks for this team
  const fetchTeamTasks = async () => {
    if (!id) return
    try {
      setTasksLoading(true)
      const response = await api.get(`/api/tasks?team=${id}&limit=50`)
      setTeamTasks(response.data || [])
    } catch (err) {
      console.error('Error fetching team tasks:', err)
    } finally {
      setTasksLoading(false)
    }
  }

  // Fetch recent comments from all team tasks
  const fetchTeamComments = async () => {
    if (!id) return
    try {
      // First get tasks, then fetch comments for each
      const tasksRes = await api.get(`/api/tasks?team=${id}&limit=20`)
      const tasks = tasksRes.data || []
      
      // Fetch comments for each task
      const allComments = []
      for (const task of tasks) {
        try {
          const commentsRes = await api.get(`/api/comments/task/${task._id}`)
          const comments = commentsRes.data || []
          // Add task info to each comment
          comments.forEach(comment => {
            allComments.push({
              ...comment,
              taskTitle: task.title,
              taskId: task._id
            })
          })
        } catch (e) {
          // Skip if no comments
        }
      }
      
      // Sort by date, newest first
      allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setTeamComments(allComments.slice(0, 20)) // Keep only recent 20
    } catch (err) {
      console.error('Error fetching team comments:', err)
    }
  }

  // Handlers
  const handleAddMember = async (e) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      await api.post(`/api/teams/${id}/members`, { email })
      setEmail('')
      setShowAddMember(false)
      fetchTeam()
    } catch (err) {
      setError(err.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      await api.delete(`/api/teams/${id}/members/${memberId}`)
      fetchTeam()
    } catch (err) {
      setError(err.message || 'Failed to remove member')
    }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.put(`/api/teams/${id}`)
      setShowSettings(false)
      fetchTeam()
    } catch (err) {
      setError(err.message || 'Failed to update settings')
    }
  }

  const handleDeleteTeam = async () => {
    try {
      await api.delete(`/api/teams/${id}`)
      navigate('/teams')
    } catch (err) {
      setError(err.message || 'Failed to delete team')
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Generate new room code? Old code will no longer work.')) return
    
    try {
      await api.post(`/api/teams/${id}/regenerate-code`)
      fetchTeam()
    } catch (err) {
      setError(err.message || 'Failed to regenerate code')
    }
  }

  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark}>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading team details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark} backTo="/teams" backLabel="All Teams" title="Loading...">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="ml-3 text-slate-600 dark:text-slate-400">Loading team details...</p>
        </div>
      </AppLayout>
    )
  }

  // Show team not found only after loading is complete
  if (!team) {
    return (
      <AppLayout dark={dark} setDark={setDark} backTo="/teams" backLabel="All Teams" title="Team not found">
        <div className="text-center py-20">
          <p className="text-slate-600 dark:text-slate-400">Team not found</p>
          <Link to="/teams" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Teams
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      backTo="/teams"
      backLabel="All Teams"
      title={team?.name || 'Loading...'}
      subtitle={team ? `${team.members?.length || 0} members` : ''}
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-8 max-w-6xl">
        {/* Team Header - Clean Professional */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${getTeamColor(team.name)} flex items-center justify-center text-white text-2xl font-semibold shadow-sm flex-shrink-0`}>
                  {(team.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {team.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {team.members?.length || 0} members
                    </span>
                    {team.company && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{team.company}</span>
                      </>
                    )}
                    {isTeamCreator && (
                      <span className="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Creator
                      </span>
                    )}
                    {isTeamAdmin && !isTeamCreator && (
                      <span className="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {isTeamAdmin && (
                  <>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {isTeamCreator && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {team.description && (
              <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-2xl">
                {team.description}
              </p>
            )}

            {/* Stats Row */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Created by</p>
                <p className="font-medium text-slate-900 dark:text-white">{team.createdBy?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
                <p className="font-medium text-slate-900 dark:text-white">{team.members?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {team.createdAt ? format(new Date(team.createdAt), 'MMM d, yyyy') : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tasks</p>
                <p className="font-medium text-slate-900 dark:text-white">{teamTasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings & Join Code - Combined Section */}
        {isTeamAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-slate-900 dark:text-white">Team Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Join code and preferences</p>
                </div>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSettings && (
              <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-700">
                {/* Join Code */}
                <div className="pt-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Team Join Code
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono text-lg text-slate-900 dark:text-white text-center tracking-wider">
                      {team.roomCode}
                    </div>
                    <button
                      onClick={handleRegenerateCode}
                      className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Generate new code"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Share this code with people you want to invite to this team.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Member - Clean Design */}
        {isTeamAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Add Member</h3>
            
            {!showAddMember ? (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                + Add Team Member
              </button>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddMember(false); setEmail('') }}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Team Members
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {team.members?.length || 0} total
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {team.members?.filter(m => m.role === 'admin').length || 0} admins
                </span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {team?.members?.map(member => (
              <div
                key={member.user?._id || member.user}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getTeamColor(member.user?.name || 'M')} flex items-center justify-center text-white text-sm font-semibold`}>
                    {(member.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {member.user?.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {member.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Admin
                    </span>
                  )}
                  {isTeamAdmin && String(member.user?._id || member.user) !== String(user?._id) && (
                    <button
                      onClick={() => handleRemoveMember(member.user?._id || member.user)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Activity
              </h2>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tasks ({teamTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'conversations'
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Conversations ({teamComments.length})
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                {tasksLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading tasks...</p>
                  </div>
                ) : teamTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No tasks assigned to this team yet.</p>
                  </div>
                ) : (
                  teamTasks.map(task => (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {task.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                              task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {task.status === 'done' ? 'Completed' :
                               task.status === 'inprogress' ? 'In Progress' :
                               'Todo'}
                            </span>
                            
                            {/* Priority Badge */}
                            {task.priority && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            )}
                            
                            {/* Due Date Badge */}
                            {task.dueDate && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                new Date(task.dueDate) < new Date() && task.status !== 'done'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                Due: {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                            
                            {/* AI Badge */}
                            {task.aiAnalysis && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                AI
                              </span>
                            )}
                            
                            {task.assignedTo && (
                              <span className="text-xs text-slate-500">
                                @{task.assignedTo.name?.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Conversations Tab */}
            {activeTab === 'conversations' && (
              <div className="space-y-4">
                {teamComments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No conversations yet. Start by adding comments to tasks.</p>
                  </div>
                ) : (
                  teamComments.map(comment => (
                    <div
                      key={comment._id}
                      onClick={() => navigate(`/tasks/${comment.taskId}`)}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${getTeamColor(comment.user?.name || 'U')} flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}>
                          {(comment.user?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900 dark:text-white text-sm">
                              {comment.user?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
                            {comment.content}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            on: {comment.taskTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Team
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                Are you sure you want to delete <strong>{team.name}</strong>? This will permanently delete all tasks and conversations. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTeam}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
