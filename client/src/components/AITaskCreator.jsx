import { useState } from 'react'
import { useAI } from '../hooks/useAI'
import { useTeams } from '../hooks/useTeams'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const AITaskCreator = ({ onTaskCreated, dark }) => {
  const [mode, setMode] = useState('ai') // 'manual' or 'ai' - AI is now default
  const [text, setText] = useState('')
  const [aiPreview, setAiPreview] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const { createAITask, parseTaskText, loading, error, setError } = useAI()
  const { user } = useAuth()
  const { memberTeams, getAllTeamMembers, canCreateTask } = useTeams()

  // Manual mode fields (full form)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [assignmentType, setAssignmentType] = useState('')
  const [creating, setCreating] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState(null)

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

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

      // Reset form
      setTitle('')
      setDescription('')
      setStatus('todo')
      setSelectedTeam('')
      setAssignedTo('')
      setAssignmentType('')
      setError(null)
      
      onTaskCreated()
    } catch (err) {
      setError('Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleAISubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    setAiPreview(null)
    setAiAnalysis(null)

    const result = await createAITask({
      text,
      mode: 'ai'
    })

    if (result?.success === false) {
      setError(result.message)
      return
    }

    if (result?.task) {
      onTaskCreated(result.task)
      setText('')
      setAiPreview(null)
      setAiAnalysis(null)
      setError(null)
    }
  }

  const handleTextChange = (e) => {
    const value = e.target.value
    setText(value)
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Debounced real-time AI preview for AI mode
    if (value.length > 10 && mode === 'ai') {
      const timer = setTimeout(async () => {
        const parsed = await parseTaskText(value)
        if (parsed) {
          setAiPreview(parsed)
          setAiAnalysis(parsed.aiAnalysis || null)
        }
      }, 500) // Wait 500ms after user stops typing
      setDebounceTimer(timer)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Task Creator
          </h3>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button
            onClick={() => setMode('manual')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
              mode === 'ai'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            AI Powered
          </button>
        </div>
      </div>

      {/* AI Mode */}
      {mode === 'ai' && (
        <>
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-md border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Just describe naturally:</span> Who, what, when, and why. AI will handle everything.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 italic">
              "Ask Nayan to complete the Q4 report by Friday - it's urgent for the board meeting"
            </p>
          </div>

          <form onSubmit={handleAISubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Task Description
              </label>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Describe your task naturally with assignee, deadline, and priority..."
                className="w-full px-3 py-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[100px]"
                rows={4}
              />
            </div>

            {/* AI Preview */}
            {aiPreview && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">AI Preview:</p>
                <div className="space-y-1.5 text-xs">
                  {aiPreview.assignedToName && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Assignee:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{aiPreview.assignedToName}</span>
                    </div>
                  )}
                  {aiPreview.title && aiPreview.title !== text && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Task:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{aiPreview.title}</span>
                    </div>
                  )}
                  {aiPreview.dueDateText && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Due:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{aiPreview.dueDateText}</span>
                    </div>
                  )}
                  {aiPreview.priority && aiPreview.priority !== 'medium' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Priority:</span>
                      <span className={`font-medium ${
                        aiPreview.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {aiPreview.priority}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Analysis */}
                {aiAnalysis && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1.5">AI Insights:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {aiAnalysis.estimatedHours && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Est. {aiAnalysis.estimatedHours}h
                          </span>
                        </div>
                      )}
                      {aiAnalysis.importance && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                            {aiAnalysis.importance}
                          </span>
                        </div>
                      )}
                    </div>
                    {aiAnalysis.reasoning && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                        "{aiAnalysis.reasoning}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full px-3 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  AI Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create with AI
                </>
              )}
            </button>
          </form>
        </>
      )}

      {/* Manual Mode - Full Form */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Select Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value)
                setAssignmentType('')
                setAssignedTo('')
              }}
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a team first</option>
              {memberTeams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} {team.members?.some(m => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin') ? '(Admin)' : '(Member)'}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Type */}
          {selectedTeam && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Assignment Type
              </label>
              <select
                value={assignmentType}
                onChange={(e) => {
                  setAssignmentType(e.target.value)
                  setAssignedTo('')
                }}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select assignment type</option>
                <option value="team">Whole Team</option>
                <option value="individual">Individual Member</option>
              </select>
            </div>
          )}

          {/* Member Selection */}
          {selectedTeam && assignmentType === 'individual' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Select Member
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose a member</option>
                {getAllTeamMembers()
                  .filter(m => m.teamId === selectedTeam)
                  .map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="todo">Todo</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="w-full px-3 py-2.5 text-sm bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors font-medium"
          >
            {creating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </button>
        </form>
      )}
    </div>
  )
}

export default AITaskCreator
