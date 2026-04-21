import { useState } from 'react'
import { useAI } from '../hooks/useAI'
import { useTeams } from '../hooks/useTeams'

const AITaskCreator = ({ onTaskCreated, dark }) => {
  const [text, setText] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [parsedTask, setParsedTask] = useState(null)
  const [needsAssignment, setNeedsAssignment] = useState(false)
  const { createAITask, parseTaskText, loading, error, setError } = useAI()
  const { teams, memberTeams, getAllTeamMembers } = useTeams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    // If AI mode is on, first parse to check if team/member is specified
    if (showAI) {
      const parsed = await parseTaskText(text)
      console.log('AI parsed result:', parsed)
      if (parsed) {
        setParsedTask(parsed)
        
        // Check if AI detected a team or member, or if user selected from dropdown
        const hasTeam = parsed.teamName || selectedTeam
        const hasAssignee = parsed.assignedToName || selectedMember
        
        console.log('AI parsed - hasTeam:', hasTeam, 'hasAssignee:', hasAssignee)
        console.log('parsed.teamName:', parsed.teamName, 'parsed.assignedToName:', parsed.assignedToName)
        console.log('selectedTeam:', selectedTeam, 'selectedMember:', selectedMember)
        
        // If neither team nor assignee detected/selected, ask user to specify
        if (!hasTeam && !hasAssignee) {
          setNeedsAssignment(true)
          setError('Please specify which team or member to assign this task to, or select from the dropdowns below.')
          return
        }
      }
    }

    // Proceed with task creation
    const finalTeamId = selectedTeam || (parsedTask?.teamId) || null
    const finalAssignedTo = selectedMember || (parsedTask?.assignedTo) || null
    console.log('Creating AI task with teamId:', finalTeamId, 'assignedTo:', finalAssignedTo)
    const result = await createAITask(text, finalTeamId, finalAssignedTo)
    console.log('AI task created result:', result)
    
    // Check for backend errors
    if (result?.success === false) {
      setError(result.message || 'Failed to create task')
      return
    }
    
    if (result?.task) {
      onTaskCreated(result.task)
      setText('')
      setSelectedTeam('')
      setSelectedMember('')
      setParsedTask(null)
      setNeedsAssignment(false)
      setShowAI(false)
    } else if (result?.error || result?.message) {
      setError(result.message || 'Failed to create task')
    }
  }

  const availableMembers = selectedTeam 
    ? getAllTeamMembers().filter(m => m.teamId === selectedTeam)
    : getAllTeamMembers()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            AI Task Assistant
          </h3>
        </div>
        <button
          onClick={() => {
            setShowAI(!showAI)
            setNeedsAssignment(false)
            setParsedTask(null)
          }}
          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
            showAI 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          {showAI ? 'AI Mode: Active' : 'AI Mode: Simple'}
        </button>
      </div>

      {showAI && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-100 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <span className="font-semibold">Powered by AI:</span> Describe your task with assignee, team, and deadline. Example: "Ask John from Sales to prepare Q4 report by Dec 15"
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            {showAI ? 'Task Description' : 'Task Title'}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              showAI 
                ? "e.g., 'Assign John from Sales to prepare Q4 report by Dec 15, high priority'"
                : 'Enter task title...'
            }
            className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={showAI ? 3 : 2}
          />
        </div>

        {needsAssignment && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
              <span className="font-semibold">Assignment Required:</span> Please select a team and/or member for this task:
            </p>
          </div>
        )}

        {memberTeams.length > 0 && (
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${needsAssignment ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
              Team {needsAssignment && <span className="text-red-500">*</span>}
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value)
                setSelectedMember('')
              }}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-1 transition-colors ${
                needsAssignment && !selectedTeam
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              } text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select team...</option>
              {memberTeams.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>
          </div>
        )}

        {(selectedTeam || availableMembers.length > 0) && (
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${needsAssignment ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
              Assign to Member {needsAssignment && <span className="text-red-500">*</span>}
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-1 transition-colors ${
                needsAssignment && !selectedMember
                  ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              } text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Choose a member...</option>
              {availableMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.team})
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim() || (needsAssignment && !selectedTeam && !selectedMember)}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Processing...
            </>
          ) : (
            showAI ? 'Create Task with AI' : 'Create Task'
          )}
        </button>
      </form>

      {showAI && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">AI extracts:</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
              Assignee
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
              Team
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
              Deadline
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
              Priority
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AITaskCreator
