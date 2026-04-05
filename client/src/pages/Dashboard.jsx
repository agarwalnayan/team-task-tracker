import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeams } from '../hooks/useTeams'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import NotificationBell from '../components/NotificationBell'
import NotificationInfo from '../components/NotificationInfo'
import { extractData, extractPagination } from '../utils/extractData'

const field =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white'

const lbl =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

const statusColors = {
  todo: 'bg-gray-100 text-gray-600',
  inprogress: 'bg-blue-100 text-blue-600',
  done: 'bg-green-100 text-green-600'
}

const statusLabels = {
  todo: 'Todo',
  inprogress: 'In Progress',
  done: 'Done'
}

export default function Dashboard({ dark, setDark }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { teams, getAllTeamMembers, canCreateTask } = useTeams()

  const [tasks, setTasks] = useState([])

  // filters
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })

  // pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [assignmentType, setAssignmentType] = useState('') // 'team' or 'individual'
  const [showForm, setShowForm] = useState(false)

  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  // ================= FETCH TASKS =================
  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        search: filters.search
      })

      const res = await api.get(`/api/tasks?${params}`)
      
      setTasks(extractData(res))
      setPagination(extractPagination(res))
    } catch (err) {
      setError('Failed to fetch tasks')
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filters, pagination.page])

  // ================= HANDLERS =================
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const payload = { title, description, status }
      
      // Handle assignment
      if (selectedTeam && assignmentType === 'team') {
        payload.team = selectedTeam
      } else if (selectedTeam && assignmentType === 'individual' && assignedTo) {
        payload.assignedTo = assignedTo
      }

      await api.post('/api/tasks', payload)

      setTitle('')
      setDescription('')
      setStatus('todo')
      setSelectedTeam('')
      setAssignedTo('')
      setAssignmentType('')
      setShowForm(false)

      fetchTasks()
    } catch (err) {
      setError('Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTask = async (id) => {
    await api.delete(`/api/tasks/${id}`)
    fetchTasks()
  }

  const handleStatusChange = async (id, newStatus) => {
    await api.put(`/api/tasks/${id}`, { status: newStatus })
    fetchTasks()
  }

  // ================= UI =================
  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      title="Task Management"
      subtitle={`${pagination.total} tasks`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Tasks</h2>
        <NotificationBell />
      </div>

      {/* ERROR */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* CREATE BUTTON */}
      {canCreateTask && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Close' : '+ New Task'}
          </button>
        </div>
      )}

      {!canCreateTask && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 mb-6">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            🔒 Only team admins can create tasks. Contact your team admin to create tasks.
          </p>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleCreateTask} className="space-y-4 mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New Task</h3>
          
          <input
            placeholder="Task Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={field}
            required
          />

          <textarea
            placeholder="Task Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={field}
            rows={3}
          />

          <div className="space-y-2">
            <label className={lbl}>Select Team</label>
            <select
              value={selectedTeam}
              onChange={e => {
                setSelectedTeam(e.target.value)
                setAssignmentType('')
                setAssignedTo('')
              }}
              className={field}
            >
              <option value="">Choose a team first</option>
              {teams.filter(team => team.members?.some(m => String(m.user?._id || m.user) === String(user._id) && m.role === 'admin')).map(team => (
                <option key={team._id} value={team._id}>
                  📋 {team.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && (
            <div className="space-y-2">
              <label className={lbl}>Assignment Type</label>
              <select
                value={assignmentType}
                onChange={e => {
                  setAssignmentType(e.target.value)
                  setAssignedTo('')
                }}
                className={field}
              >
                <option value="">Select assignment type</option>
                <option value="team">📋 Whole Team</option>
                <option value="individual">👤 Individual Member</option>
              </select>
            </div>
          )}

          {selectedTeam && assignmentType === 'individual' && (
            <div className="space-y-2">
              <label className={lbl}>Select Member</label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className={field}
              >
                <option value="">Choose a member</option>
                {getAllTeamMembers()
                  .filter(m => m.teamId === selectedTeam)
                  .map(m => (
                    <option key={m._id} value={m._id}>
                      👤 {m.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className={lbl}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={field}
            >
              <option value="todo">📝 Todo</option>
              <option value="inprogress">🚀 In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? 'Creating...' : '🚀 Create Task'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className={field}
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange(e.target.value)}
          className={field}
        >
          <option value="">All</option>
          <option value="todo">Todo</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        {Array.isArray(tasks) && tasks.map(task => (
          <div
            key={task._id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="p-6">
              {/* Task Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                      task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300'
                    }`}>
                      {task.status === 'done' ? '✅ Completed' :
                       task.status === 'inprogress' ? '🚀 In Progress' :
                       '📝 Todo'}
                    </span>
                    {task.team && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-full text-xs font-medium">
                        📋 {task.team.name || 'Team'}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full text-xs font-medium">
                        👤 {task.assignedTo.name || 'Assigned'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Task Description */}
              {task.description && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Task Metadata */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    📅 Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  {task.updatedAt && (
                    <span>
                      🔄 Updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  {task.createdBy && (
                    <span>
                      👤 By: {task.createdBy.name || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>

              {/* Task Actions */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Update Status:
                    </label>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="todo">📝 Todo</option>
                      <option value="inprogress">🚀 In Progress</option>
                      <option value="done">✅ Done</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                  >
                    🗑️ Delete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination(prev => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Prev
          </button>

          <span>
            {pagination.page} / {pagination.pages}
          </span>

          <button
            disabled={pagination.page === pagination.pages}
            onClick={() =>
              setPagination(prev => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </button>
        </div>
      )}
    </AppLayout>
  )
}