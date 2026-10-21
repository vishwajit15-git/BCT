import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('medichain_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe()
          if (res.success && res.user) {
            setUser(res.user)
          } else {
            logout()
          }
        } catch (err) {
          console.error('Session validation failed:', err.message)
          logout()
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [token])

  const login = (newToken, newUser) => {
    localStorage.setItem('medichain_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('medichain_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        isPatient: user?.role === 'patient',
        isDoctor: user?.role === 'doctor',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
