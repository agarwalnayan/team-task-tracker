import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { extractData } from '../utils/extractData'

export function useTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return
    }

    const fetchTeams = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/teams')
        setTeams(extractData(res))
      } catch (error) {
        console.error('Error fetching teams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user])

  // Check if user is admin of any team
  const isAdmin = (team) => {
    return team.members?.some(
      (m) => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
    )
  }

  // Get teams where user is admin
  const adminTeams = teams.filter(isAdmin)

  // Get all team members from all user's teams
  const getAllTeamMembers = () => {
    const membersMap = new Map()
    teams.forEach(team => {
      // Only get members from teams where user is admin
      const isAdminUser = team.members?.some(
        (m) => String(m.user?._id || m.user) === String(user?._id) && m.role === 'admin'
      )
      
      if (isAdminUser) {
        team.members?.forEach(member => {
          const userId = member.user?._id || member.user
          if (userId && String(userId) !== String(user?._id)) {
            membersMap.set(String(userId), {
              _id: userId,
              name: member.user?.name || 'Unknown',
              email: member.user?.email || '',
              role: member.role,
              team: team.name,
              teamId: team._id
            })
          }
        })
      }
    })
    return Array.from(membersMap.values())
  }

  return {
    teams,
    loading,
    isAdmin,
    adminTeams,
    getAllTeamMembers,
    canCreateTask: adminTeams.length > 0
  }
}
