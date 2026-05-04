import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '/api/v1'
  if (url.startsWith('http') && !url.includes('/api/v1')) {
    return `${url.replace(/\/$/, '')}/api/v1`
  }
  return url
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

console.log('API Base URL:', api.defaults.baseURL)


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    
    if ((status === 401 || status === 403) && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || ''
          const { data } = await axios.post(`${baseUrl}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {

        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
