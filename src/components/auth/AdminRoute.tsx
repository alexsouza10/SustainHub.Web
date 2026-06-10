import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'

export function AdminRoute() {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (
    user?.role !== UserRole.SuperAdmin &&
    user?.role !== UserRole.TenantAdmin &&
    user?.role !== UserRole.Manager
  )
    return <Navigate to="/dashboard" replace />
  return <Outlet />
}
