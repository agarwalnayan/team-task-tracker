import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamMembers } from '../hooks/useTeamMembers'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'

const field =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

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
    const navigate = useNavigate()
    const { user } = useAuth()
    const { members: teamMembers } = useTeamMembers()
    const [tasks, setTasks] = useState([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('todo')
    const [assignedTo, setAssignedTo] = useState('')
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
            const payload = { title, description, status }
            if (assignedTo) payload.assignedTo = assignedTo
            await api.post('/tasks', payload)
            setTitle('')
            setDescription('')
            setStatus('todo')
            setAssignedTo('')
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
        <AppLayout
            dark={dark}
            setDark={setDark}
            title="Tasks"
            subtitle={`${tasks.length} total — owned by you or assigned to you.`}
        >
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm" role="alert">
                        {error}
                    </div>
                )}

                <div className="flex justify-end mb-8">
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-colors"
                    >
                        {showForm ? 'Close form' : '+ New task'}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-8 mb-8">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">New task</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add details and optionally assign a teammate.</p>
                        <form onSubmit={handleCreateTask} className="space-y-5">
                            <div>
                                <label className={lbl} htmlFor="dash-title">Title</label>
                                <input
                                    id="dash-title"
                                    type="text"
                                    placeholder="What needs to be done?"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className={field}
                                    required
                                />
                            </div>
                            <div>
                                <label className={lbl} htmlFor="dash-desc">Description</label>
                                <textarea
                                    id="dash-desc"
                                    placeholder="Context, links, acceptance criteria…"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className={`${field} resize-none min-h-[100px]`}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={lbl} htmlFor="dash-assign">Assign to</label>
                                <select
                                    id="dash-assign"
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    className={field}
                                >
                                    <option value="">Unassigned</option>
                                    {teamMembers.map((m) => (
                                        <option key={m._id} value={m._id}>
                                            {m.name}
                                            {String(m._id) === String(user?._id) ? ' (you)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {teamMembers.length === 0 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Open{' '}
                                        <Link to="/teams" className="text-blue-600 dark:text-blue-400 font-medium underline">
                                            Teams
                                        </Link>{' '}
                                        to invite people. Only teammates can be assigned (server enforced).
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <label className={lbl} htmlFor="dash-status">Status</label>
                                    <select
                                        id="dash-status"
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        className={field}
                                    >
                                        <option value='todo'>Todo</option>
                                        <option value='inprogress'>In Progress</option>
                                        <option value='done'>Done</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="mt-6 sm:mt-0 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {creating ? 'Creating…' : 'Create task'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <input
                        type="search"
                        placeholder="Search by title…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={`${field} flex-1`}
                    />
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className={`${field} sm:w-44 shrink-0`}
                    >
                        <option value=''>All statuses</option>
                        <option value='todo'>Todo</option>
                        <option value='inprogress'>In progress</option>
                        <option value='done'>Done</option>
                    </select>
                </div>

                <div className="space-y-3">
                    {tasks.length === 0 && (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-center py-20 px-6">
                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No tasks match</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Create a task or adjust filters.</p>
                        </div>
                    )}
                    {tasks.map(task => (
                        <div
                            key={task._id}
                            onClick={() => navigate(`/tasks/${task._id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                navigate(`/tasks/${task._id}`)
                              }
                            }}
                            className="group bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/80 dark:ring-slate-800 p-5 sm:p-6 flex items-start justify-between gap-4 hover:ring-blue-300/80 dark:hover:ring-blue-700/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{task.title}</h4>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors[task.status]}`}>
                                        {statusLabels[task.status]}
                                    </span>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                                )}
                                {task.assignedTo && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Assigned to{' '}
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{task.assignedTo.name}</span>
                                    </p>
                                )}
                                <div className="mt-3" onClick={e => e.stopPropagation()}>
                                    <select
                                        value={task.status}
                                        onChange={e => handleStatusChange(task._id, e.target.value)}
                                        className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    >
                                        <option value='todo'>Todo</option>
                                        <option value='inprogress'>In Progress</option>
                                        <option value='done'>Done</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteTask(task._id)
                                }}
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                aria-label="Delete task"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
        </AppLayout>
    )
}

export default Dashboard