import { useState, useCallback } from 'react'
import api from '../utils/api'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 🎯 Get AI Task Suggestions
  const getSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/ai/suggestions')
      return response
    } catch (err) {
      setError(err.message || 'Failed to get AI suggestions')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 🚀 Prioritize Tasks
  const prioritizeTasks = useCallback(async (taskIds, userGoals = '') => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/prioritize', { taskIds, userGoals })
      return response
    } catch (err) {
      setError(err.message || 'Failed to prioritize tasks')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 💬 Parse Natural Language Task
  const parseTaskText = useCallback(async (text) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/parse-task', { text })
      // Extract data from wrapped response { success: true, data: {...} }
      return response.data || response
    } catch (err) {
      setError(err.message || 'Failed to parse task text')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔍 Smart Search
  const smartSearch = useCallback(async (query) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/search', { query })
      return response
    } catch (err) {
      setError(err.message || 'Search failed')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 👥 Get Team Recommendations
  const getTeamRecommendations = useCallback(async (taskId) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/recommend-members', { taskId })
      return response
    } catch (err) {
      setError(err.message || 'Failed to get recommendations')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 🏷️ Auto-categorize Task
  const categorizeTask = useCallback(async (taskId) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/categorize', { taskId })
      return response
    } catch (err) {
      setError(err.message || 'Failed to categorize task')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 📊 Get Progress Summary
  const getProgressSummary = useCallback(async (timeRange = 'week') => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/api/ai/summary/${timeRange}`)
      return response
    } catch (err) {
      setError(err.message || 'Failed to get summary')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ⚡ Get Quick Insights
  const getInsights = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/ai/insights')
      return response
    } catch (err) {
      setError(err.message || 'Failed to get insights')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 🎯 Create AI-Enhanced Task
  const createAITask = useCallback(async (text, teamId = null, assignedTo = null) => {
    try {
      setLoading(true)
      setError('')
      const response = await api.post('/api/ai/create-task', { text, teamId, assignedTo })
      return response
    } catch (err) {
      setError(err.message || 'Failed to create AI task')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    setError,
    getSuggestions,
    prioritizeTasks,
    parseTaskText,
    smartSearch,
    getTeamRecommendations,
    categorizeTask,
    getProgressSummary,
    getInsights,
    createAITask
  }
}
