import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoService } from '@/services/api'

export function useTodos(params?: { status?: string; myTodosOnly?: boolean }) {
  return useQuery({
    queryKey: ['todos', params],
    queryFn: () => todoService.getAll(params).then((r) => r.data),
  })
}

export function useCreateTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => todoService.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  })
}

export function useUpdateTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      todoService.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  })
}

export function useDeleteTodo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => todoService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  })
}
