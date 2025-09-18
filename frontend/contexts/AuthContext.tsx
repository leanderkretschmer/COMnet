'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

interface User {
  id: string
  username: string
  email: string
  display_name: string
  avatar_url?: string
  is_verified: boolean
  is_guest?: boolean
  network_name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, display_name?: string) => Promise<void>
  guestLogin: (username: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only get token after component is mounted
  const token = mounted ? Cookies.get('auth_token') : null

  // Verify token and get user data
  const { data: authData, isLoading: isVerifying } = useQuery(
    ['auth', 'verify'],
    () => api.get('/auth/verify'),
    {
      enabled: mounted && !!token,
      retry: false,
      onSuccess: (response) => {
        setUser(response.data.user)
        setIsLoading(false)
      },
      onError: () => {
        if (mounted) {
          Cookies.remove('auth_token')
        }
        setUser(null)
        setIsLoading(false)
      }
    }
  )

  // Set loading to false when mounted and no token
  useEffect(() => {
    if (mounted && !token) {
      setUser(null)
      setIsLoading(false)
    }
  }, [mounted, token])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      Cookies.set('auth_token', newToken, { expires: 7 })
      setUser(userData)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['auth'])
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Anmeldefehler')
    }
  }

  const register = async (username: string, email: string, password: string, display_name?: string) => {
    try {
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password, 
        display_name 
      })
      const { token: newToken, user: userData } = response.data
      
      Cookies.set('auth_token', newToken, { expires: 7 })
      setUser(userData)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['auth'])
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registrierungsfehler')
    }
  }

  const guestLogin = async (username: string) => {
    try {
      const response = await api.post('/auth/guest', { username })
      const { token: newToken, user: userData } = response.data
      
      Cookies.set('auth_token', newToken, { expires: 1 }) // 1 day for guests
      setUser(userData)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['auth'])
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Gast-Login-Fehler')
    }
  }

  const logout = () => {
    Cookies.remove('auth_token')
    setUser(null)
    queryClient.clear()
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading: !mounted || isLoading || isVerifying,
    isAuthenticated: !!user,
    login,
    register,
    guestLogin,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
