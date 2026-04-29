import { create } from 'zustand'
import api from '../lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('admin_token') || null,

  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    if (data.role !== 'super_admin') {
      throw new Error('Access denied. Super admin only.')
    }
    localStorage.setItem('admin_token', data.access_token)
    set({ token: data.access_token, user: data })
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    set({ token: null, user: null })
  },

  fetchMe: async () => {
    const { data } = await api.get('/api/auth/me')
    if (data.role !== 'super_admin') throw new Error('Not a super admin.')
    set({ user: data })
  },
}))
