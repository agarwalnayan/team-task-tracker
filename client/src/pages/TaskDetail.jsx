import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamMembers } from '../hooks/useTeamMembers'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import Comments from '../components/Comments'
import { extractData } from '../utils/extractData'

// Design System - Cohesive color palette matching Dashboard
const field =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'

const lbl =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'

const card =
  'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6'

export default function TaskDetail({ dark, setDark }) {
  const { id } = useParams()
  const { user } = useAuth()
  const { members: teamMembers } = useTeamMembers()

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // ================= FETCH TASK =================
  const fetchTask = async () => {
    try {
      const response = await api.get(`/api/tasks/${id}`)
      // Extract actual task data from response wrapper
      const taskData = response.data || response
      setTask(taskData)
    } catch (err) {
      setError('Failed to fetch task')
      console.error('Task fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [id])

  const isTaskOwner =
    user?._id &&
    task?.createdBy?._id &&
    String(user._id) === String(task.createdBy._id)

  // ================= ASSIGN =================
  const handleAssigneeChange = async (e) => {
    const value = e.target.value
    try {
      const response = await api.put(`/api/tasks/${id}`, {
        assignedTo: value === '' ? null : value
      })
      // Extract actual task data from response wrapper
      const taskData = response.data || response
      setTask(taskData)
    } catch (err) {
      setError(err.message || 'Failed to update assignee')
    }
  }

  // ================= FILE UPLOAD =================
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post(`/api/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setFile(null)
      e.target.reset()
      fetchTask()
    } catch {
      setError('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const statusColors = {
    todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    inprogress: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
  }

  const statusLabels = {
    todo: 'Todo',
    inprogress: 'In progress',
    done: 'Done'
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark}>
        <div className="flex justify-center py-20">Loading...</div>
      </AppLayout>
    )
  }

  if (!task) {
    return (
      <AppLayout title="Task not found" backTo="/">
        <p>Task not found</p>
      </AppLayout>
    )
  }

  // ================= UI =================
  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      backTo="/"
      backLabel="All tasks"
      title={task.title}
      subtitle={`${statusLabels[task.status]} · Created by ${task.createdBy?.name}`}
    >
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="space-y-6 max-w-3xl">

        {/* TASK INFO */}
        <section className={card}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            {task.assignedTo && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Assigned to: <span className="font-medium text-slate-900 dark:text-slate-200">{task.assignedTo.name}</span>
              </span>
            )}
          </div>

          {task.description && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{task.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Created by: <span className="font-medium text-slate-700 dark:text-slate-300">{task.createdBy?.name}</span></span>
            <span>·</span>
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>

          {/* ASSIGN */}
          {isTaskOwner && (
            <div className="mt-6">
              <label className={lbl}>Assign to</label>
              <select
                value={task.assignedTo?._id || ''}
                onChange={handleAssigneeChange}
                className={field}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* ATTACHMENTS */}
        <section className={card}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Attachments</h3>
          
          {task.attachments?.length > 0 ? (
            <div className="space-y-2">
              {task.attachments.map((f, i) => (
                <a
                  key={i}
                  href={`http://localhost:5000/${f.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {f.filename}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No attachments</p>
          )}
        </section>

        {/* COMMENTS */}
        <section className={card}>
          <Comments taskId={id} />
        </section>

      </div>
    </AppLayout>
  )
}