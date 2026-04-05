import { useState } from 'react'
import api from '../utils/api'

export default function JoinTeamByCode({ onJoinSuccess }) {
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setJoining(true)
    setError('')

    try {
      const response = await api.post('/api/teams/join-by-code', { roomCode })
      onJoinSuccess && onJoinSuccess(response.team)
      setRoomCode('')
    } catch (err) {
      setError(err.message || 'Failed to join team')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        🚪 Join Team by Code
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Room Code
          </label>
          <input
            type="text"
            placeholder="Enter 6-character code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white uppercase"
            maxLength={6}
            pattern="[A-Z0-9]{6}"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={joining || roomCode.length !== 6}
          className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {joining ? 'Joining...' : '🚪 Join Team'}
        </button>
      </form>
    </div>
  )
}
