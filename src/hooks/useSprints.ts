import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sprintService } from '@/services/api'
import { SprintDto } from '@/types'

export function useSprints() {
  return useQuery<SprintDto[]>({
    queryKey: ['sprints'],
    queryFn: () => sprintService.getAll().then(r => r.data),
  })
}

export function useCreateSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      goal?: string
      type: number
      startDate: string
      endDate: string
    }) => sprintService.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}

export function useUpdateSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      name?: string
      goal?: string
      status?: number
      startDate?: string
      endDate?: string
    }) => sprintService.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}

export function useDeleteSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sprintService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints'] }),
  })
}
