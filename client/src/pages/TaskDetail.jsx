import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamMembers } from '../hooks/useTeamMembers'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'

const field =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'
const card = 'rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-7'

export default function TaskDetail({ dark, setDark }) {
  const { id } = useParams()
  const { user } = useAuth()
  const { members: teamMembers } = useTeamMembers()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [error, setError] = useState('')

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`)
      setTask(res.data)
    } catch {
      setError('Failed to fetch task')
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

  const handleAssigneeChange = async (e) => {
    const value = e.target.value
    try {
      const res = await api.put(`/tasks/${id}`, {
        assignedTo: value === '' ? null : value
      })
      setTask(res.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update assignee')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    try {
      await api.post(`/tasks/${id}/comments`, { text: comment })
      setComment('')
      fetchTask()
    } catch {
      setError('Failed to add comment')
    } finally {
      setCommenting(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/tasks/${id}/upload`, formData, {
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
    todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    inprogress: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
  }

  const statusLabels = {
    todo: 'Todo',
    inprogress: 'In progress',
    done: 'Done'
  }

  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading task…</p>
        </div>
      </AppLayout>
    )
  }

  if (!task) {
    return (
      <AppLayout dark={dark} setDark={setDark} backTo="/" backLabel="All tasks" title="Task not found">
        <p className="text-slate-600 dark:text-slate-400">This task may have been deleted or you don&apos;t have access.</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      dark={dark}
      setDark={setDark}
      backTo="/"
      backLabel="All tasks"
      title={task.title}
      subtitle={`${statusLabels[task.status]} · Created by ${task.createdBy?.name || '—'}`}
    >
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
          </div>
          {task.description && (
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Owner:{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">{task.createdBy?.name}</span>
            </span>
            {task.assignedTo && !isTaskOwner && (
              <span>
                Assigned:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">{task.assignedTo?.name}</span>
              </span>
            )}
            {task.dueDate && (
              <span>
                Due:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </span>
            )}
          </div>

          {isTaskOwner && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <label className={lbl} htmlFor="assignee">
                Assign to
              </label>
              <select
                id="assignee"
                value={task.assignedTo?._id ?? ''}
                onChange={handleAssigneeChange}
                className={`${field} max-w-md`}
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Use{' '}
                  <Link to="/teams" className="text-blue-600 dark:text-blue-400 font-medium underline">
                    Teams
                  </Link>{' '}
                  to invite people. Only shared teammates can be assigned.
                </p>
              )}
            </div>
          )}
        </section>

        <section className={card}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Attachments
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">({task.attachments?.length || 0})</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Files linked to this task.</p>
          {task.attachments?.length > 0 && (
            <ul className="space-y-2 mb-5">
              {task.attachments.map((f, index) => (
                <li key={f._id ?? index}>
                  <a
                    href={`http://localhost:5000/${f.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ring-1 ring-slate-200/60 dark:ring-slate-700/60"
                  >
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{f.filename}</span>
                    <span className="text-xs text-slate-400 shrink-0">Open</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label className={lbl}>Upload file</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/50 dark:file:text-blue-300"
              />
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shrink-0"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </section>

        <section className={card}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Comments
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">({task.comments?.length || 0})</span>
          </h3>
          <div className="space-y-4 mb-6 mt-4">
            {(!task.comments || task.comments.length === 0) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center rounded-xl bg-slate-50/80 dark:bg-slate-800/30">
                No comments yet.
              </p>
            )}
            {task.comments?.map((c, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-sm font-bold text-blue-700 dark:text-blue-300">
                  {c.createdBy?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/40 px-4 py-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.createdBy?.name}</span>
                    <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Write a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={field}
            />
            <button
              type="submit"
              disabled={!comment.trim() || commenting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold disabled:opacity-50 shrink-0"
            >
              {commenting ? 'Posting…' : 'Post'}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
