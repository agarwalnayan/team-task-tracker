import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import { formatDistanceToNow } from 'date-fns'

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
  const [allowJoinByCode, setAllowJoinByCode] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isTeamAdmin = team?.members?.some(
    m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
  )

  const isTeamCreator = String(team.createdBy?._id || team.createdBy) === String(user?._id)

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
      setAllowJoinByCode(response.allowJoinByCode || false)
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
    setUpdating(true)
    setError('')

    try {
      await api.put(`/api/teams/${id}`, { allowJoinByCode })
      setShowSettings(false)
      fetchTeam()
    } catch (err) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setUpdating(false)
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

  if (!team) {
    return (
      <AppLayout title="Team not found" backTo="/teams">
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
      title={team.name}
      subtitle={`${team.members?.length || 0} members`}
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-8 max-w-6xl">
        {/* Team Header Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
          {/* Gradient Header */}
          <div className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {(team.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {team.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {team.members?.length || 0} Members
                    </span>
                    {team.company && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        {team.company}
                      </span>
                    )}
                    {isTeamCreator && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
                        👑 Creator
                      </span>
                    )}
                    {isTeamAdmin && !isTeamCreator && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg">
                        ⚡ Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {team.description && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{team.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Created by</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{team.createdBy?.name || 'Unknown'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Members</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{team.members?.length || 0}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Company</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{team.company || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Room Code Management - Only for admins and creators */}
        {(isTeamAdmin || isTeamCreator) && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">🔑 Room Code</h2>
                <p className="text-blue-700 dark:text-blue-300">Share this code with team members to join</p>
              </div>
              <button
                onClick={handleRegenerateCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                🔄 Regenerate
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-800 dark:text-blue-200 font-mono mb-2 tracking-wider">
                {team.roomCode}
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Team Room Code</p>
            </div>
          </div>
        )}

        {/* Team Settings - Only for admins */}
        {isTeamAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">⚙️ Team Settings</h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg"
              >
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </button>
            </div>

            {showSettings && (
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Allow Join by Code</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Members can join using room code</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowJoinByCode}
                        onChange={(e) => setAllowJoinByCode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg font-medium"
                >
                  {updating ? 'Updating...' : '💾 Update Settings'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Add Member - Only for admins */}
        {isTeamAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">👥 Add Member</h2>
            
            {!showAddMember ? (
              <button
                onClick={() => setShowAddMember(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium"
              >
                ➕ Add New Member
              </button>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg font-medium"
                  >
                    {adding ? 'Adding...' : '✅ Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            👥 Team Members ({team.members?.length || 0})
          </h2>
          
          <div className="grid gap-4">
            {team?.members?.map(member => (
              <div
                key={member.user?._id || member.user}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    {(member.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {member.user?.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {member.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    member.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {member.role === 'admin' ? '⚡ Admin' : '👤 Member'}
                  </span>
                  {member.canManageRoles && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                      👑 Manager
                    </span>
                  )}
                  {isTeamAdmin && String(member.user?._id || member.user) !== String(user?._id) && (
                    <button
                      onClick={() => handleRemoveMember(member.user?._id || member.user)}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors text-sm font-medium"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Tasks & Conversations */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Team Activity
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Tasks ({teamTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'conversations'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Conversations ({teamComments.length})
              </button>
            </div>
          </div>

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {task.status === 'done' ? 'Completed' :
                             task.status === 'inprogress' ? 'In Progress' :
                             'Todo'}
                          </span>
                          {task.assignedTo && (
                            <span className="text-xs text-slate-500">
                              Assigned to: {task.assignedTo.name}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                          </span>
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
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium flex-shrink-0">
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
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
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

        {/* Delete Team - Only for creators */}
        {isTeamCreator && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl border border-red-200 dark:border-red-800/50 shadow-xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">⚠️ Danger Zone</h2>
                <p className="text-red-700 dark:text-red-300">
                  Delete this team and all associated tasks. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg font-medium"
              >
                🗑️ Delete Team
              </button>
            </div>

            {/* Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Delete Team
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Are you sure you want to delete this team? This action cannot be undone and all associated tasks will be deleted.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
