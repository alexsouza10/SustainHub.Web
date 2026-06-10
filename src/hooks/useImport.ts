import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/services/api'
import { ParsedRow } from '@/lib/importParse'

export interface ImportPayload {
  rows: ParsedRow[]
  projectId: string
}

export function useImportTickets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rows, projectId }: ImportPayload) =>
      apiClient.post('/tickets/import', {
        projectId,
        rows: rows.map(r => ({
          title:       r.title,
          description: r.description,
          type:        r.type,
          priority:    r.priority,
          tags:        r.tags,
        })),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
