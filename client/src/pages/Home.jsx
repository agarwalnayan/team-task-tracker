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
  const [hoveredCard, setHoveredCard] = useState(null)

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

  const StatCard = ({ title, value, icon, color, link, id, progress }) => (
    <div 
      onClick={() => link && navigate(link)}
      onMouseEnter={() => setHoveredCard(id)}
      onMouseLeave={() => setHoveredCard(null)}
      className={`p-6 rounded-xl border ${color} cursor-pointer hover:shadow-xl transition-all duration-300 ${
        link ? 'hover:scale-105 hover:-translate-y-1' : ''
      } ${hoveredCard === id ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`text-3xl transition-transform duration-300 ${hoveredCard === id ? 'scale-110 opacity-100' : 'opacity-20'}`}>{icon}</div>
      </div>
      {progress !== undefined && progress > 0 && (
        <div className="mt-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{progress}% of total</p>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <AppLayout dark={dark} setDark={setDark} title="Overview" subtitle="Loading your workspace...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </AppLayout>
    )
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  return (
    <AppLayout dark={dark} setDark={setDark} title="Overview" subtitle={`Welcome back, ${user?.name}`}>
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-blue-100">
          Here's your productivity overview. Manage tasks, collaborate with teams, and achieve your goals.
        </p>
        {completionRate > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium">{completionRate}% tasks completed</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          id="total"
          title="Total Tasks"
          value={stats.totalTasks}
          icon="📋"
          color="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
          link="/dashboard"
        />
        <StatCard
          id="completed"
          title="Completed"
          value={stats.completedTasks}
          icon="✅"
          color="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50"
          link="/dashboard"
          progress={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
        />
        <StatCard
          id="inprogress"
          title="In Progress"
          value={stats.inProgressTasks}
          icon="�"
          color="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
          link="/dashboard"
          progress={stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}
        />
        <StatCard
          id="pending"
          title="Pending"
          value={stats.pendingTasks}
          icon="⏳"
          color="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50"
          link="/dashboard"
          progress={stats.totalTasks > 0 ? Math.round((stats.pendingTasks / stats.totalTasks) * 100) : 0}
        />
        <StatCard
          id="teams"
          title="Teams"
          value={stats.totalTeams}
          icon="👥"
          color="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50"
          link="/teams"
        />
        <StatCard
          id="members"
          title="Team Members"
          value={stats.totalMembers}
          icon="🤝"
          color="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50"
          link="/teams"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Tasks</h3>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-all"
            >
              View All →
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No tasks yet</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          task.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                          task.status === 'inprogress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300'
                        }`}>
                          {task.status === 'done' ? 'Completed' :
                           task.status === 'inprogress' ? 'In Progress' :
                           'Todo'}
                        </span>
                        {task.team && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {task.team.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                <span className="font-medium text-slate-900 dark:text-white">Create New Task</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/teams')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
                <span className="font-medium text-slate-900 dark:text-white">Manage Teams</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/teams')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform">�</span>
                <span className="font-medium text-slate-900 dark:text-white">Join Team by Code</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full text-left p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform">⚙️</span>
                <span className="font-medium text-slate-900 dark:text-white">Profile Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
