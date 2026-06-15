import { TicketStatus } from '@/types'

// High-level status groups shown on the Tasks screen.
export type StatusGroup = 'all' | 'open' | 'in-progress' | 'blocked' | 'done' | 'bug'

export const STATUS_GROUP_MEMBERS: Record<Exclude<StatusGroup, 'all'>, TicketStatus[]> = {
  'open':         [TicketStatus.Backlog],
  'in-progress':  [TicketStatus.OnGoing, TicketStatus.InReview],
  'blocked':      [TicketStatus.Impedido],
  'done':         [TicketStatus.Complete, TicketStatus.AceitoEmProducao],
  'bug':          [TicketStatus.GerouBug],
}

export const STATUS_GROUP_LABEL: Record<StatusGroup, string> = {
  'all':         'All',
  'open':        'Backlog',
  'in-progress': 'In Progress',
  'blocked':     'Impedido',
  'done':        'Done',
  'bug':         'Gerou Bug',
}

// tailwind color tokens per group — dark: variants garantem contraste em ambos os temas
export const STATUS_GROUP_COLOR: Record<StatusGroup, { text: string; dot: string; ring: string }> = {
  'all':         { text: 'text-foreground',                              dot: 'bg-slate-400',                          ring: 'ring-slate-400/40'  },
  'open':        { text: 'text-blue-600 dark:text-blue-400',            dot: 'bg-blue-500 dark:bg-blue-400',          ring: 'ring-blue-500/40'   },
  'in-progress': { text: 'text-cyan-700 dark:text-cyan-400',            dot: 'bg-cyan-600 dark:bg-cyan-400',          ring: 'ring-cyan-500/40'   },
  'blocked':     { text: 'text-red-600 dark:text-red-400',              dot: 'bg-red-500 dark:bg-red-400',            ring: 'ring-red-500/40'    },
  'done':        { text: 'text-green-600 dark:text-green-400',          dot: 'bg-green-500 dark:bg-green-400',        ring: 'ring-green-500/40'  },
  'bug':         { text: 'text-orange-600 dark:text-orange-400',        dot: 'bg-orange-500 dark:bg-orange-400',      ring: 'ring-orange-500/40' },
}

export function inStatusGroup(status: TicketStatus, group: StatusGroup): boolean {
  if (group === 'all') return true
  return STATUS_GROUP_MEMBERS[group].includes(status)
}

export function statusGroupOf(status: TicketStatus): Exclude<StatusGroup, 'all'> {
  for (const g of Object.keys(STATUS_GROUP_MEMBERS) as Exclude<StatusGroup, 'all'>[]) {
    if (STATUS_GROUP_MEMBERS[g].includes(status)) return g
  }
  return 'open'
}
