import { useState } from 'react'

export default function NotificationInfo() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
        title="What are notifications?"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {showInfo && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📢 Notifications</h3>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>Notifications keep you updated about:</p>
            <ul className="space-y-1 ml-4">
              <li>• 🔔 New tasks assigned to you</li>
              <li>• 📝 Task status changes</li>
              <li>• 💬 New comments on your tasks</li>
              <li>• 👋 Team invitations</li>
              <li>• ✅ Task completions</li>
            </ul>
            <p className="pt-2 text-xs text-slate-500">
              Click on any notification to go directly to the related task or team.
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  )
}
