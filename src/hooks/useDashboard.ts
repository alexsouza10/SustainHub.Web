import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/api'

export function useMetrics(params?: { projectId?: string }) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', params],
    queryFn: () => dashboardService.getMetrics(params).then((r) => r.data),
  })
}

export function useBugTrend() {
  return useQuery({
    queryKey: ['dashboard', 'bug-trend'],
    queryFn: () => dashboardService.getBugTrend().then((r) => r.data),
  })
}

export function usePriorityDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'priority-distribution'],
    queryFn: () => dashboardService.getPriorityDistribution().then((r) => r.data),
  })
}
