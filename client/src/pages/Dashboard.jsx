import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamMembers } from '../hooks/useTeamMembers'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import NotificationBell from '../components/NotificationBell'

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
  const { members: teamMembers } = useTeamMembers()

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
  const [assignedTo, setAssignedTo] = useState('')
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

      setTasks(res.data)
      setPagination(res.pagination)
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
      if (assignedTo) payload.assignedTo = assignedTo

      await api.post('/api/tasks', payload)

      setTitle('')
      setDescription('')
      setStatus('todo')
      setAssignedTo('')
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
    await api.put(`/api/tasks/${id}/status`, { status: newStatus })
    fetchTasks()
  }

  // ================= UI =================
  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      title="Dashboard"
      subtitle={`${pagination.total} tasks`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <NotificationBell />
      </div>

      {/* ERROR */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* CREATE BUTTON */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg"
        >
          {showForm ? 'Close' : '+ New Task'}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleCreateTask} className="space-y-4 mb-6">
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={field}
            required
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={field}
          />

          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            className={field}
          >
            <option value="">Unassigned</option>
            {teamMembers.map(m => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className={field}
          >
            <option value="todo">Todo</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <button
            disabled={creating}
            className="px-4 py-2 bg-black text-white rounded"
          >
            {creating ? 'Creating...' : 'Create Task'}
          </button>
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
      <div className="space-y-3">
        {tasks.map(task => (
          <div
            key={task._id}
            className="p-4 border rounded-lg flex justify-between cursor-pointer"
            onClick={() => navigate(`/tasks/${task._id}`)}
          >
            <div>
              <h4 className="font-semibold">{task.title}</h4>
              <span className={`text-xs px-2 py-1 rounded ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                className="text-sm"
              >
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <button
                onClick={() => handleDeleteTask(task._id)}
                className="ml-3 text-red-500"
              >
                ✕
              </button>
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