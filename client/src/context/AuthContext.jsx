import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔍 Check existing login
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/api/auth/me')
      .then((data) => {
        setUser(data.user || data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const data = await api.post('/api/auth/login', {
        email: String(email || '').trim().toLowerCase(),
        password
      })

      console.log('LOGIN RESPONSE:', data)

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      const userData = data.user || data

      setUser({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        company: userData.company,
        phone: userData.phone,
        phoneCountryCode: userData.phoneCountryCode,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified
      })
    } catch (err) {
      console.error('Login Error:', err)
      throw err
    }
  }

  // 🆕 REGISTER
  const register = async (name, email, password, company, phone, phoneCountryCode) => {
    try {
      const body = {
        name: String(name).trim(),
        email: String(email || '').trim().toLowerCase(),
        password
      }

      if (company && String(company).trim()) {
        body.company = String(company).trim()
      }

      if (phone && String(phone).trim()) {
        body.phone = String(phone).trim()
        body.phoneCountryCode = phoneCountryCode || 'US'
      }

      const data = await api.post('/api/auth/register', body)

      console.log('REGISTER RESPONSE:', data)

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      const userData = data.user || data

      setUser({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        company: userData.company,
        phone: userData.phone,
        phoneCountryCode: userData.phoneCountryCode,
        emailVerified: userData.emailVerified,
        phoneVerified: userData.phoneVerified
      })
    } catch (err) {
      console.error('Register Error:', err)
      throw err
    }
  }

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // ✏️ UPDATE PROFILE
  const updateProfile = async (payload) => {
    const data = await api.patch('/api/auth/me', payload)
    setUser(data.user || data)
  }

  // 🔑 UPDATE PASSWORD
  const updatePassword = async (currentPassword, newPassword) => {
    await api.patch('/api/auth/me/password', { currentPassword, newPassword })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 🔗 Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}