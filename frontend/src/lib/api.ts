import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? '/api' : undefined)

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !API_URL) {
    return Promise.reject(new Error('VITE_API_URL must be set to the deployed backend URL, ending in /api.'))
  }
  const token = localStorage.getItem('ef_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('ef_token')) {
      localStorage.removeItem('ef_token')
      localStorage.removeItem('ef_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
