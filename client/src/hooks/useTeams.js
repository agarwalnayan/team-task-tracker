import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { extractData } from '../utils/extractData'

export function useTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTeams = async () => {
    if (!user) return
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

  useEffect(() => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return
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

  // Get all team members from ALL teams where user is a member (not just admin)
  const getAllTeamMembers = useCallback(() => {
    const membersMap = new Map()
    teams.forEach(team => {
      // Check if user is a member of this team (any role)
      const isTeamMember = team.members?.some(
        (m) => String(m.user?._id || m.user) === String(user?._id)
      )
      
      if (isTeamMember) {
        team.members?.forEach(member => {
          const userId = member.user?._id || member.user
          // Include all members except current user
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
  }, [teams, user])

  // Get teams where user is a member (any role) - for task assignment
  const memberTeams = teams.filter(team => 
    team.members?.some(m => String(m.user?._id || m.user) === String(user?._id))
  )

  return {
    teams,
    loading,
    isAdmin,
    adminTeams,
    memberTeams,
    getAllTeamMembers,
    canCreateTask: adminTeams.length > 0,
    refetch: fetchTeams
  }
}
