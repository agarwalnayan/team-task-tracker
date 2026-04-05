import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTeams } from '../hooks/useTeams'
import AppLayout from '../components/AppLayout'
import api from '../utils/api'
import { extractData, extractPagination } from '../utils/extractData'

export default function Home({ dark, setDark }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { teams, getAllTeamMembers } = useTeams()
  
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    totalTeams: 0,
    totalMembers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch user's tasks
      const tasksRes = await api.get('/api/tasks?limit=10')
      const tasksData = extractData(tasksRes)
      
      // Calculate stats
      const totalTasks = tasksData.length
      const completedTasks = tasksData.filter(t => t.status === 'done').length
      const pendingTasks = tasksData.filter(t => t.status === 'todo').length
      const inProgressTasks = tasksData.filter(t => t.status === 'inprogress').length
      const totalTeams = teams.length
      const totalMembers = getAllTeamMembers().length

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalTeams,
        totalMembers
      })
      
      setTasks(tasksData.slice(0, 5)) // Show recent 5 tasks
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, link }) => (
    <div 
      onClick={() => link && navigate(link)}
      className={`p-6 rounded-xl border ${color} cursor-pointer hover:shadow-lg transition-all duration-200 ${
        link ? 'hover:scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-20">{icon}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark} title="Dashboard" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout dark={dark} setDark={setDark} title="Dashboard" subtitle={`Welcome back, ${user?.name}!`}>
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to Task Tracker! 👋</h1>
        <p className="text-blue-100">
          Here's your productivity overview. Manage tasks, collaborate with teams, and achieve your goals.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon="📋"
          color="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
          link="/dashboard"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon="✅"
          color="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressTasks}
          icon="🚀"
          color="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50"
        />
        <StatCard
          title="Pending"
          value={stats.pendingTasks}
          icon="⏳"
          color="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50"
        />
        <StatCard
          title="Teams"
          value={stats.totalTeams}
          icon="👥"
          color="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50"
          link="/teams"
        />
        <StatCard
          title="Team Members"
          value={stats.totalMembers}
          icon="🤝"
          color="bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📝 Recent Tasks</h3>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View All →
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No tasks yet</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">{task.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'done' ? 'bg-green-100 text-green-600' :
                        task.status === 'inprogress' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status === 'done' ? 'Completed' :
                         task.status === 'inprogress' ? 'In Progress' :
                         'Todo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">🚀 Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">➕</span>
                <span className="font-medium text-slate-900 dark:text-white">Create New Task</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/teams')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <span className="font-medium text-slate-900 dark:text-white">Manage Teams</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/teams')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🚪</span>
                <span className="font-medium text-slate-900 dark:text-white">Join Team by Code</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <span className="font-medium text-slate-900 dark:text-white">Profile Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
