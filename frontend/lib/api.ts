import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    verify: '/auth/verify',
  },
  users: {
    profile: '/users/profile',
    update: '/users/update',
  },
  communities: {
    list: '/communities',
    create: '/communities',
    get: (id: string) => `/communities/${id}`,
    join: (id: string) => `/communities/${id}/join`,
    leave: (id: string) => `/communities/${id}/leave`,
    members: (id: string) => `/communities/${id}/members`,
  },
  posts: {
    list: '/posts',
    create: '/posts',
    get: (id: string) => `/posts/${id}`,
    update: (id: string) => `/posts/${id}`,
    delete: (id: string) => `/posts/${id}`,
    vote: (id: string) => `/posts/${id}/vote`,
  },
  comments: {
    list: (postId: string) => `/posts/${postId}/comments`,
    create: (postId: string) => `/posts/${postId}/comments`,
    update: (id: string) => `/comments/${id}`,
    delete: (id: string) => `/comments/${id}`,
    vote: (id: string) => `/comments/${id}/vote`,
  },
  networks: {
    list: '/networks',
    get: (id: string) => `/networks/${id}`,
  },
  federation: {
    actors: '/federation/actors',
    posts: '/federation/posts',
  },
} as const

export default api
