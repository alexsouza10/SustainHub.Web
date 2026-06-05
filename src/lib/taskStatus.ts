import { TicketStatus } from '@/types'

// High-level status groups shown on the Tasks screen.
// Maps the 8 backend statuses into the buckets the user asked for:
// open (em aberto), in-progress (andamento), blocked (impedido),
// done (concluído), cancelled (cancelado).
export type StatusGroup = 'all' | 'open' | 'in-progress' | 'blocked' | 'done' | 'cancelled'

export const STATUS_GROUP_MEMBERS: Record<Exclude<StatusGroup, 'all'>, TicketStatus[]> = {
  'open':         [TicketStatus.Backlog, TicketStatus.Ready],
  'in-progress':  [TicketStatus.InProgress, TicketStatus.InReview, TicketStatus.WaitingClient],
  'blocked':      [TicketStatus.Blocked],
  'done':         [TicketStatus.Done],
  'cancelled':    [TicketStatus.Cancelled],
}

export const STATUS_GROUP_LABEL: Record<StatusGroup, string> = {
  'all':         'All',
  'open':        'Open',
  'in-progress': 'In Progress',
  'blocked':     'Blocked',
  'done':        'Done',
  'cancelled':   'Cancelled',
}

// tailwind color tokens per group (text / accent ring / dot)
export const STATUS_GROUP_COLOR: Record<StatusGroup, { text: string; dot: string; ring: string }> = {
  'all':         { text: 'text-foreground',   dot: 'bg-slate-400',   ring: 'ring-slate-400/40' },
  'open':        { text: 'text-blue-400',     dot: 'bg-blue-400',    ring: 'ring-blue-400/40' },
  'in-progress': { text: 'text-cyan-400',     dot: 'bg-cyan-400',    ring: 'ring-cyan-400/40' },
  'blocked':     { text: 'text-red-400',      dot: 'bg-red-400',     ring: 'ring-red-400/40' },
  'done':        { text: 'text-green-400',    dot: 'bg-green-400',   ring: 'ring-green-400/40' },
  'cancelled':   { text: 'text-gray-400',     dot: 'bg-gray-400',    ring: 'ring-gray-400/40' },
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
