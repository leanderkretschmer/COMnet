'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'

interface User {
  id: string
  username: string
  email: string
  display_name: string
  avatar_url?: string
  is_verified: boolean
  network_name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, display_name?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const token = isClient ? Cookies.get('auth_token') : null

  // Verify token and get user data
  const { data: authData, isLoading: isVerifying } = useQuery(
    ['auth', 'verify'],
    () => api.get('/auth/verify'),
    {
      enabled: !!token,
      retry: false,
      onSuccess: (response) => {
        setUser(response.data.user)
      },
      onError: () => {
        Cookies.remove('auth_token')
        setUser(null)
      }
    }
  )

  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
    } else if (!isVerifying) {
      setIsLoading(false)
    }
  }, [token, isVerifying])

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
    isLoading: isLoading || isVerifying || !isClient,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  }

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <AuthContext.Provider value={{
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: async () => {},
        register: async () => {},
        logout: () => {},
        updateUser: () => {}
      }}>
        {children}
      </AuthContext.Provider>
    )
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
