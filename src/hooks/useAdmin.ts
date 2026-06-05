import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/services/api'

export interface TenantDto {
  id: string
  name: string
  plan: string
  isActive: boolean
  createdAt: string
  userCount: number
}

export interface UserAdminDto {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  tenantName: string
  isActive: boolean
  createdAt: string
}

export function useTenants() {
  return useQuery<TenantDto[]>({
    queryKey: ['admin-tenants'],
    queryFn: () => apiClient.get('/admin/tenants').then(r => r.data),
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; plan: string }) =>
      apiClient.post('/admin/tenants', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] })
    },
  })
}

export function useAdminUsers(tenantId?: string) {
  return useQuery<UserAdminDto[]>({
    queryKey: ['admin-users', tenantId],
    queryFn: () => apiClient.get('/admin/users', { params: { tenantId } }).then(r => r.data),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/admin/users', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.put(`/admin/users/${id}/status`, { isActive }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put(`/admin/tenants/${id}`, { id, name }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/admin/users/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiClient.post(`/admin/users/${id}/reset-password`, { newPassword: password }).then(r => r.data),
  })
}
