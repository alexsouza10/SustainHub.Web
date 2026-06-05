import { useQuery } from '@tanstack/react-query'
import apiClient from '@/services/api'

export interface ProjectDto {
  id: string
  name: string
  description: string
  createdAt: string
}

export function useProjects() {
  return useQuery<ProjectDto[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects').then(r => r.data),
  })
}
