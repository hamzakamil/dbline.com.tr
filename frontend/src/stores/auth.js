import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setAuth(data) {
    user.value = data.user
    token.value = data.token
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data)
    return data
  }

  async function register(name, email, password, phone) {
    const { data } = await api.post('/auth/register', { name, email, password, phone })
    setAuth(data)
    return data
  }

  async function loginWithGoogle(credential) {
    const { data } = await api.post('/auth/google', { credential })
    setAuth(data)
    return data
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  // Token varsa header'a ekle
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return { user, token, isLoggedIn, isAdmin, login, register, loginWithGoogle, logout, setAuth }
})
