import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const statusColors = {
  todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  inprogress: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
}

const statusLabels = {
  todo: 'Todo',
  inprogress: 'In Progress',
  done: 'Done'
}

const Dashboard = ({ dark, setDark }) => {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchTasks = async () => {
    try {
      let url = '/tasks'
      const params = []
      if (filter) params.push(`status=${filter}`)
      if (search) params.push(`search=${search}`)
      if (params.length) url += '?' + params.join('&')
      const res = await api.get(url)
      setTasks(res.data)
    } catch (err) {
      setError('Failed to fetch tasks')
    }
  }

  useEffect(() => { fetchTasks() }, [filter, search])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/tasks', { title, description, status })
      setTitle('')
      setDescription('')
      setStatus('todo')
      setShowForm(false)
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      fetchTasks()
    } catch (err) {
      setError('Failed to delete task')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/tasks/${id}`, { status: newStatus })
      fetchTasks()
    } catch (err) {
      setError('Failed to update task')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TaskFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user?.name}
            </span>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
            >
              {dark ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tasks.length} tasks total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <input
                type='text'
                placeholder='Task title'
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder='Description (optional)'
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex items-center gap-4">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value='todo'>Todo</option>
                  <option value='inprogress'>In Progress</option>
                  <option value='done'>Done</option>
                </select>
                <button
                  type='submit'
                  disabled={creating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <input
            type='text'
            placeholder='Search tasks...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value=''>All Status</option>
            <option value='todo'>Todo</option>
            <option value='inprogress'>In Progress</option>
            <option value='done'>Done</option>
          </select>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-lg font-medium">No tasks yet</p>
              <p className="text-sm mt-1">Click "+ New Task" to get started</p>
            </div>
          )}
          {tasks.map(task => (
            <div
              key={task._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">{task.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{task.description}</p>
                )}
                <div className="mt-3">
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task._id, e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value='todo'>Todo</option>
                    <option value='inprogress'>In Progress</option>
                    <option value='done'>Done</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(task._id)}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard