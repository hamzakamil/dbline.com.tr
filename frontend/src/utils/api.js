import axios from 'axios'
import router from '../router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Token varsa header'a ekle
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Response interceptor - 401 gelirse otomatik logout
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
      // Admin sayfasındaysa login'e yönlendir
      if (router.currentRoute.value.path.startsWith('/admin') || router.currentRoute.value.meta.requiresAuth) {
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
      }
    }
    return Promise.reject(error)
  }
)

export default api
