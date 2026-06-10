import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/api'
import apiClient from '@/services/api'
// apiClient is the default export, ticketService is a named export — both from the same module
import type { PagedResult, TicketDto, Priority } from '@/types'

export function useTickets(params?: { status?: string; priority?: string }) {
  return useQuery<PagedResult<TicketDto>>({
    queryKey: ['tickets', params],
    queryFn: () => ticketService.getAll(params).then((r) => r.data),
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => ticketService.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ticketService.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTickets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => ticketService.delete(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useSuggestPriority() {
  return useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      apiClient.post<{ priority: Priority; priorityName: string }>('/tickets/suggest-priority', { title, description })
        .then(r => r.data),
  })
}

export function useMoveTicketsToSprint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, sprintId }: { ids: string[]; sprintId: string }) =>
      Promise.all(ids.map(id => ticketService.update(id, { sprintId }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['sprints'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
