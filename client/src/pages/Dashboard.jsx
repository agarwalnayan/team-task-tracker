import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAI } from '../hooks/useAI'
import AppLayout from '../components/AppLayout'
import AITaskCreator from '../components/AITaskCreator'
import AIInsights from '../components/AIInsights'
import api from '../utils/api'
import { extractData, extractPagination } from '../utils/extractData'

// Design System - Cohesive color palette
const field =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'

const statusColors = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  inprogress: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
}

const statusLabels = {
  todo: 'Todo',
  inprogress: 'In Progress',
  done: 'Done'
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  high: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  urgent: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
}

const importanceColors = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-amber-600 dark:text-amber-400',
  normal: 'text-slate-500 dark:text-slate-400',
  low: 'text-slate-400 dark:text-slate-500'
}

export default function Dashboard({ dark, setDark }) {
  const navigate = useNavigate()
  const { smartSearch } = useAI()

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

  const [error, setError] = useState('')

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
      const tasksData = extractData(res)
      console.log('Fetched tasks:', tasksData)
      console.log('First task team:', tasksData[0]?.team)
      
      setTasks(tasksData)
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
      title="Dashboard"
      subtitle={`${pagination.total} total tasks`}
    >
      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* TOP SECTION: Task Entry + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <AITaskCreator onTaskCreated={fetchTasks} dark={dark} />
        </div>
        <div>
          <AIInsights dark={dark} />
        </div>
      </div>

      {/* TASK LIST HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Task List</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {pagination.total} total tasks
        </span>
      </div>

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
                    {task.aiGenerated && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                        AI
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                      task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {task.status === 'done' ? 'Completed' :
                       task.status === 'inprogress' ? 'In Progress' :
                       'Todo'}
                    </span>
                    
                    {/* Priority Badge */}
                    {task.priority && task.priority !== 'medium' && (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || priorityColors.medium}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                    )}
                    
                    {/* Due Date */}
                    {task.dueDate && (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                        new Date(task.dueDate) < new Date() && task.status !== 'done'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                          <span className="ml-1 text-red-500 font-semibold">(Overdue)</span>
                        )}
                      </span>
                    )}
                    
                    {/* Team Badge */}
                    {task.team && (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded text-xs font-medium" title={`Team: ${typeof task.team === 'object' ? task.team.name : task.team}`}>
                        {typeof task.team === 'object' ? (task.team.name || 'Team') : 'Team'}
                      </span>
                    )}
                    
                    {/* Assignee Badge */}
                    {task.assignedTo && (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded text-xs font-medium">
                        {task.assignedTo.name || 'Assigned'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
            onClick={() => navigate(`/tasks/${task._id}`)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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

              {/* AI Analysis - Only show for AI-generated tasks */}
              {task.aiGenerated && task.aiAnalysis && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">AI Insights</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {task.aiAnalysis.estimatedHours && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-600 dark:text-slate-400">
                          Est. <span className="font-medium">{task.aiAnalysis.estimatedHours}h</span>
                        </span>
                      </div>
                    )}
                    {task.aiAnalysis.importance && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className={`capitalize font-medium ${importanceColors[task.aiAnalysis.importance]}`}>
                          {task.aiAnalysis.importance}
                        </span>
                      </div>
                    )}
                    {task.estimatedHours && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-slate-600 dark:text-slate-400">
                          Complex: <span className="font-medium">{task.estimatedHours}h</span>
                        </span>
                      </div>
                    )}
                  </div>
                  {task.aiAnalysis.reasoning && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 italic">
                      "{task.aiAnalysis.reasoning}"
                    </p>
                  )}
                </div>
              )}

              {/* Task Metadata */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  {task.updatedAt && task.updatedAt !== task.createdAt && (
                    <span>
                      Updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  {task.createdBy && (
                    <span>
                      By: {task.createdBy.name || 'Unknown'}
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
                      className="text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="todo">Todo</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                  >
                    Delete
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