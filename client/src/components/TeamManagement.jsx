import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function TeamManagement({ team, onUpdate }) {
  const { user } = useAuth()
  const [showAddMember, setShowAddMember] = useState(false)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  
  const [showSettings, setShowSettings] = useState(false)
  const [allowJoinByCode, setAllowJoinByCode] = useState(team?.allowJoinByCode || true)
  const [updating, setUpdating] = useState(false)

  const [showRoleManagement, setShowRoleManagement] = useState(false)

  const isTeamAdmin = team?.members?.some(
    m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
  )

  const handleAddMember = async (e) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      await api.post(`/api/teams/${team._id}/members`, { email })
      setEmail('')
      setShowAddMember(false)
      onUpdate && onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      await api.delete(`/api/teams/${team._id}/members/${memberId}`)
      onUpdate && onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to remove member')
    }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    try {
      await api.put(`/api/teams/${team._id}`, { allowJoinByCode })
      setShowSettings(false)
      onUpdate && onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('⚠️ Are you sure you want to delete this team? This action cannot be undone and all team tasks will be deleted.')) return
    
    try {
      await api.delete(`/api/teams/${team._id}`)
      onUpdate && onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to delete team')
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Generate new room code? Old code will no longer work.')) return
    
    try {
      const response = await api.post(`/api/teams/${team._id}/regenerate-code`)
      onUpdate && onUpdate()
    } catch (err) {
      setError(err.message || 'Failed to regenerate code')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          ⚙️ {team.name} Management
        </h3>
        <div className="flex items-center gap-2">
          {isTeamAdmin && (
            <button
              onClick={() => setShowRoleManagement(!showRoleManagement)}
              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg"
              title="Manage Roles"
            >
              👑
            </button>
          )}
          {isTeamAdmin && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              title="Team Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Room Code Display - Only for admins */}
      {isTeamAdmin && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Room Code</p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{team.roomCode}</p>
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Share this code with team members to join
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Role Management */}
      {showRoleManagement && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">👑 Role Management</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1.5">
                Select Member to Update
              </label>
              <select
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-purple-900/50 text-purple-900 dark:text-purple-100"
              >
                <option value="">Choose a member</option>
                {team?.members?.map(member => (
                  <option key={member.user?._id || member.user} value={member.user?._id || member.user}>
                    {member.user?.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                Promote to Admin
              </button>
              <button className="px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm">
                Demote to Member
              </button>
            </div>

            <p className="text-xs text-purple-700 dark:text-purple-300">
              Note: You cannot change the role of the team creator
            </p>
          </div>
        </div>
      )}

      {/* Team Settings - Only for admins */}
      {isTeamAdmin && showSettings && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Team Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Room Code</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{team.roomCode}</p>
              </div>
              <button
                onClick={handleRegenerateCode}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔄 Regenerate
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Allow Join by Code</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Members can join using room code</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowJoinByCode}
                  onChange={(e) => setAllowJoinByCode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              onClick={handleUpdateSettings}
              disabled={updating}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Add Member */}
      {isTeamAdmin && (
        <div className="mb-6">
          {!showAddMember ? (
            <button
              onClick={() => setShowAddMember(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Add Member
            </button>
          ) : (
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : '👤 Add Member'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMember(false)
                    setEmail('')
                    setError('')
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Members List */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Team Members</h4>
        <div className="space-y-2">
          {team?.members?.map(member => (
            <div
              key={member.user?._id || member.user}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {(member.user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {member.user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-300'
                }`}>
                  {member.role}
                </span>
                {member.canManageRoles && (
                  <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded">
                    👑
                  </span>
                )}
                {isTeamAdmin && String(member.user?._id || member.user) !== String(user?._id) && (
                  <button
                    onClick={() => handleRemoveMember(member.user?._id || member.user)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Team - Only for team creators */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        {isTeamAdmin && String(team.createdBy?._id || team.createdBy) === String(user?._id) ? (
          <button
            onClick={handleDeleteTeam}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Delete Team
          </button>
        ) : (
          <div className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-center">
            🗑️ Delete Team (Only team creator can delete)
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          This will delete the team and all associated tasks
        </p>
      </div>
    </div>
  )
}
