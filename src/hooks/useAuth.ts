import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { user, tenantName, token, refreshToken, isAuthenticated, login, logout, setUser } = useAuthStore()

  return {
    user,
    tenantName,
    token,
    refreshToken,
    isAuthenticated,
    login,
    logout,
    setUser,
  }
}
