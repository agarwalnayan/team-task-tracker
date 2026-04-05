import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { extractData } from '../utils/extractData'

/** Unique users from teams you belong to (for task assignment). Skips teams in another company if your profile has a company set. */
export function useTeamMembers() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setMembers([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    api
      .get('/api/teams')
      .then((res) => {
        const map = new Map()
        for (const team of extractData(res) || []) {
          if (
            user.company &&
            team.company &&
            team.company !== user.company
          ) {
            continue
          }
          for (const m of team.members || []) {
            const u = m.user
            if (u?._id) {
              map.set(String(u._id), {
                _id: u._id,
                name: u.name || u.email,
                email: u.email
              })
            }
          }
        }
        if (!cancelled) {
          setMembers([...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
        }
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?._id, user?.company])

  return { members, loading }
}
