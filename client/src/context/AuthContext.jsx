import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email: String(email || '').trim().toLowerCase(),
      password
    })
    localStorage.setItem('token', data.token)
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      company: data.company
    })
  }

  const register = async (name, email, password, company) => {
    const body = {
      name: String(name).trim(),
      email: String(email || '').trim().toLowerCase(),
      password
    }
    if (company && String(company).trim()) body.company = String(company).trim()
    const { data } = await api.post('/auth/register', body)
    localStorage.setItem('token', data.token)
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      company: data.company
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateProfile = async (payload) => {
    const { data } = await api.patch('/auth/me', payload)
    setUser(data)
  }

  const updatePassword = async (currentPassword, newPassword) => {
    await api.patch('/auth/me/password', { currentPassword, newPassword })
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
