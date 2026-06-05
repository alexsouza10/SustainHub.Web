import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  tenantName: string | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (user: User, tenantName: string, token: string, refreshToken: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  tenantName: localStorage.getItem('tenantName'),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, tenantName, token, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('tenantName', tenantName)
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, tenantName, token, refreshToken, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('tenantName')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    set({ user: null, tenantName: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))
