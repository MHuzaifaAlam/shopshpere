import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearAuthData, setAuthData } from '../services/api'

const AuthContext = createContext(null)

const normalizeUser = (payload = null, fallbackUsername = 'Customer') => {
  if (!payload) {
    return null
  }

  const username = payload.username || payload.user?.username || fallbackUsername

  return {
    id: payload.id ?? payload.user?.id ?? null,
    username,
    email: payload.email ?? payload.user?.email ?? '',
    is_staff: Boolean(payload.is_staff ?? payload.user?.is_staff ?? false),
    is_superuser: Boolean(payload.is_superuser ?? payload.user?.is_superuser ?? false),
    is_active: Boolean(payload.is_active ?? payload.user?.is_active ?? true),
    groups: payload.groups ?? payload.user?.groups ?? [],
    permissions: payload.permissions ?? payload.user?.permissions ?? [],
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('shopSphereUser')
      return storedUser ? normalizeUser(JSON.parse(storedUser)) : null
    } catch {
      return null
    }
  })

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const loadUserFromSession = async () => {
      const token = localStorage.getItem('shopSphereAccessToken')

      if (!token) {
        setIsReady(true)
        return
      }

      try {
        const { data } = await api.get('/api/me/')
        const nextUser = normalizeUser(data)

        localStorage.setItem('shopSphereUser', JSON.stringify(nextUser))
        setUser(nextUser)
      } catch {
        clearAuthData()
        setUser(null)
      } finally {
        setIsReady(true)
      }
    }

    loadUserFromSession()
  }, [])

  const login = async (credentials) => {
    const { data } = await api.post('/api/token/', credentials)
    const baseUser = {
      username: credentials.username,
      is_staff: false,
      is_superuser: false,
    }

    setAuthData({
      access: data.access,
      refresh: data.refresh,
      user: baseUser,
    })

    try {
      const { data: profile } = await api.get('/api/me/')
      const nextUser = normalizeUser(profile, credentials.username)

      setAuthData({
        access: data.access,
        refresh: data.refresh,
        user: nextUser,
      })
      setUser(nextUser)
      return nextUser
    } catch {
      const nextUser = normalizeUser(baseUser, credentials.username)
      setUser(nextUser)
      return nextUser
    }
  }

  const register = async (payload) => {
    const { data } = await api.post('/api/register/', payload)
    return data
  }

  const logout = () => {
    clearAuthData()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user?.is_staff),
      isAdmin: Boolean(user?.is_superuser),
      isReady,
      login,
      register,
      logout,
    }),
    [user, isReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
