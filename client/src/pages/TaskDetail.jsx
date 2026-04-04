import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeamMembers } from '../hooks/useTeamMembers'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import Comments from '../components/Comments'

const field =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white'

const lbl =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

const card =
  'rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/80 dark:ring-slate-800 shadow-sm p-6 sm:p-7'

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
      const res = await api.get(`/api/tasks/${id}`)
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

  // ================= ASSIGN =================
  const handleAssigneeChange = async (e) => {
    const value = e.target.value
    try {
      const res = await api.put(`/api/tasks/${id}`, {
        assignedTo: value === '' ? null : value
      })
      setTask(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update assignee')
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
    todo: 'bg-slate-100 text-slate-700',
    inprogress: 'bg-blue-100 text-blue-800',
    done: 'bg-emerald-100 text-emerald-800'
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
          <span className={`text-xs px-3 py-1 rounded ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>

          {task.description && (
            <p className="mt-4 text-sm">{task.description}</p>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Owner: {task.createdBy?.name}
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
          <h3 className="font-semibold mb-4">Attachments</h3>

          {task.attachments?.map((f, i) => (
            <a
              key={i}
              href={`http://localhost:5000/${f.path}`}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 mb-2"
            >
              {f.filename}
            </a>
          ))}

          <form onSubmit={handleUpload} className="mt-4 flex gap-3">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </section>

        {/* COMMENTS (MERGED CLEANLY) */}
        <section className={card}>
          <h3 className="font-semibold mb-4">Comments</h3>

          <Comments taskId={id} />
        </section>

      </div>
    </AppLayout>
  )
}