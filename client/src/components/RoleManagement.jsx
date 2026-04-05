import { useState } from 'react'
import api from '../utils/api'

export default function RoleManagement({ team, onUpdate }) {
  const [managingRole, setManagingRole] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [newRole, setNewRole] = useState('member')
  const [canManageRoles, setCanManageRoles] = useState(false)
  const [error, setError] = useState('')

  const handleRoleUpdate = async (e) => {
    e.preventDefault()
    setManagingRole(true)
    setError('')

    try {
      await api.put(`/api/teams/${team._id}/members/${selectedMember}`, {
        role: newRole,
        canManageRoles
      })
      
      onUpdate && onUpdate()
      setSelectedMember('')
      setNewRole('member')
      setCanManageRoles(false)
    } catch (err) {
      setError(err.message || 'Failed to update role')
    } finally {
      setManagingRole(false)
    }
  }

  const members = team.members?.filter(m => m.user?._id) || []

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        👥 Manage Team Roles
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Select Member
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white"
          >
            <option value="">Choose a member</option>
            {members.map(member => (
              <option key={member.user._id} value={member.user._id}>
                {member.user.name} - {member.role}
              </option>
            ))}
          </select>
        </div>

        {selectedMember && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="canManageRoles"
                checked={canManageRoles}
                onChange={(e) => setCanManageRoles(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="canManageRoles" className="text-sm text-slate-700 dark:text-slate-300">
                Can manage team roles
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {selectedMember && (
          <button
            onClick={handleRoleUpdate}
            disabled={managingRole}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {managingRole ? 'Updating...' : '🔧 Update Role'}
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Team Members:</h4>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.user._id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {member.user.name}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {member.role}
                </span>
                {member.canManageRoles && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    👑
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
