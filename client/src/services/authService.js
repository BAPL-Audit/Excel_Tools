import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed')
  }
}

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed')
  }
}

export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    // Even if logout fails on server, clear local storage
    console.error('Logout error:', error)
  }
}

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/profile')
    return response.data
  } catch (error) {
    throw new Error('Failed to get current user')
  }
}

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile')
  }
}

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send reset email')
  }
}

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to reset password')
  }
}

// OAuth functions
export const getGoogleAuthUrl = () => {
  return `${API_BASE_URL}/auth/google`
}

export const getGitHubAuthUrl = () => {
  return `${API_BASE_URL}/auth/github`
}