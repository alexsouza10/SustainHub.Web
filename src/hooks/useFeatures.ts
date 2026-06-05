import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featureService } from '@/services/api'

export function useFeatures(params?: { projectId?: string }) {
  return useQuery({
    queryKey: ['features', params],
    queryFn: () => featureService.getAll(params).then((r) => r.data),
  })
}

export function useCreateFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => featureService.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
  })
}

export function useUpdateFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      featureService.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
  })
}

export function useDeleteFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => featureService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
  })
}
