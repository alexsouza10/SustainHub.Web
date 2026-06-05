import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/api'

export interface TenantUserDto {
  id: string
  name: string
  email: string
  role: string
}

export function useTenantUsers() {
  return useQuery<TenantUserDto[]>({
    queryKey: ['tenant-users'],
    queryFn: () => userService.getTenantUsers().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
