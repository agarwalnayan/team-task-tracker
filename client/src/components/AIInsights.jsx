import { useState, useEffect } from 'react'
import { useAI } from '../hooks/useAI'

const AIInsights = ({ dark }) => {
  const [insights, setInsights] = useState([])
  const [summary, setSummary] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const { getInsights, getProgressSummary, loading } = useAI()

  useEffect(() => {
    loadAIContent()
  }, [])

  const loadAIContent = async () => {
    const [insightsData, summaryData] = await Promise.all([
      getInsights(),
      getProgressSummary('week')
    ])
    
    setInsights(insightsData || [])
    setSummary(summaryData)
  }

  const getInsightIcon = (type) => {
    // Using Lucide-style SVG icons instead of emojis for professional look
    switch (type) {
      case 'productivity_tip': return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
      case 'bottleneck_alert': return (
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
      case 'opportunity': return (
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
      default: return (
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'productivity_tip': return 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-400 text-blue-800 dark:text-blue-300'
      case 'bottleneck_alert': return 'bg-slate-50 dark:bg-slate-900/50 border-l-4 border-slate-400 text-slate-700 dark:text-slate-300'
      case 'opportunity': return 'bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-400 text-emerald-800 dark:text-emerald-300'
      default: return 'bg-slate-50 dark:bg-slate-900/50 border-l-4 border-slate-400 text-slate-700 dark:text-slate-300'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Performance Overview
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          {showDetails ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Productivity Score */}
      {summary && (
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Productivity Score</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{summary.productivityScore}<span className="text-base font-normal text-slate-400">/100</span></p>
            </div>
            <div className="text-right">
              <div className="w-14 h-14 relative">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(summary.productivityScore / 100) * 151} 151`}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {summary.productivityScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      <div className="space-y-2.5">
        {insights.slice(0, showDetails ? insights.length : 2).map((insight, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg ${getInsightColor(insight.type)}`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insight.message}</p>
              {insight.actionable && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Actionable insight</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      {showDetails && summary && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wide">Weekly Summary</h4>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary.summary}</p>
            
            {summary.achievements && summary.achievements.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mb-2">Achievements</p>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {summary.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recommendations && summary.recommendations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 mb-2">Recommendations</p>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {summary.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={loadAIContent}
          disabled={loading}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs font-medium disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  )
}

export default AIInsights
