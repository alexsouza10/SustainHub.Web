import { useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint } from '@/hooks/useSprints'
import { useTickets, useUpdateTicket } from '@/hooks/useTickets'
import { SprintDto, TicketDto, TicketStatus, Priority, PRIORITY_LABEL, STATUS_LABEL } from '@/types'
import { cn } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp,
  CalendarDays, Target, Layers, CheckCircle2, Clock, ArrowRight,
  SquareKanban,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── constants ─────────────────────────────────────────────────────────────────

const SPRINT_STATUS_LABEL: Record<number, string> = { 1: 'Planning', 2: 'Active', 3: 'Closed' }
const SPRINT_STATUS_COLOR: Record<number, string> = {
  1: 'text-yellow-400 bg-yellow-500/10',
  2: 'text-green-400 bg-green-500/10',
  3: 'text-slate-400 bg-slate-500/10',
}
const SPRINT_TYPE_LABEL: Record<number, string> = { 1: 'Sprint', 2: 'Sustentation' }

const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.P1]: 'text-red-400 bg-red-500/10',
  [Priority.P2]: 'text-orange-400 bg-orange-500/10',
  [Priority.P3]: 'text-yellow-400 bg-yellow-500/10',
  [Priority.P4]: 'text-green-400 bg-green-500/10',
}

const STATUS_COLOR: Record<number, string> = {
  [TicketStatus.Backlog]:       'text-slate-300 bg-slate-500/10',
  [TicketStatus.Ready]:         'text-blue-300 bg-blue-500/10',
  [TicketStatus.InProgress]:    'text-cyan-300 bg-cyan-500/10',
  [TicketStatus.Blocked]:       'text-red-300 bg-red-500/10',
  [TicketStatus.WaitingClient]: 'text-purple-300 bg-purple-500/10',
  [TicketStatus.InReview]:      'text-orange-300 bg-orange-500/10',
  [TicketStatus.Done]:          'text-green-300 bg-green-500/10',
  [TicketStatus.Cancelled]:     'text-gray-300 bg-gray-500/10',
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const toInputDate = (s: string) => s.slice(0, 10)

// ── main ──────────────────────────────────────────────────────────────────────

export function Sprints() {
  const [showCreate, setShowCreate]     = useState(false)
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [assignModal, setAssignModal]   = useState<SprintDto | null>(null)
  const [confirmDel, setConfirmDel]     = useState<SprintDto | null>(null)

  const { data: sprints = [], isLoading } = useSprints()
  const { data: ticketPage }              = useTickets()
  const allTickets                        = ticketPage?.items ?? []

  const deleteSprint = useDeleteSprint()

  const sorted = useMemo(() =>
    [...sprints].sort((a, b) => {
      if (a.status === 2 && b.status !== 2) return -1
      if (b.status === 2 && a.status !== 2) return 1
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    }),
    [sprints]
  )

  return (
    <MainLayout title="Sprints" subtitle="Organize tasks into time-boxed iterations">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SquareKanban className="h-4 w-4" />
          <span>{sprints.length} sprint{sprints.length !== 1 ? 's' : ''}</span>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Sprint
        </Button>
      </div>

      {/* create form */}
      {showCreate && (
        <SprintCreateForm onClose={() => setShowCreate(false)} />
      )}

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <SquareKanban className="h-12 w-12 opacity-20" />
          <p className="text-sm">No sprints yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(sprint => {
            const tickets   = allTickets.filter(t => t.sprintId === sprint.id)
            const done      = tickets.filter(t => t.status === TicketStatus.Done).length
            const progress  = sprint.ticketCount > 0 ? Math.round((sprint.doneCount / sprint.ticketCount) * 100) : 0
            const expanded  = expandedId === sprint.id
            const editing   = editingId === sprint.id

            return (
              <Card key={sprint.id} className={cn(
                'transition-colors',
                sprint.status === 2 && 'border-green-500/30 bg-green-500/5'
              )}>
                <CardContent className="p-0">
                  {/* sprint header */}
                  {editing ? (
                    <SprintEditForm
                      sprint={sprint}
                      onClose={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base truncate">{sprint.name}</span>
                            <Badge className={cn('text-[10px] h-5', SPRINT_STATUS_COLOR[sprint.status])}>
                              {SPRINT_STATUS_LABEL[sprint.status]}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {SPRINT_TYPE_LABEL[sprint.type]}
                            </Badge>
                          </div>

                          {sprint.goal && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Target className="h-3 w-3 flex-shrink-0" />
                              {sprint.goal}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              {sprint.ticketCount} task{sprint.ticketCount !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-400" />
                              {sprint.doneCount} done
                            </span>
                          </div>

                          {/* progress bar */}
                          {sprint.ticketCount > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-muted-foreground">Progress</span>
                                <span className="text-[10px] font-medium">{progress}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Assign tasks"
                            onClick={() => setAssignModal(sprint)}>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit sprint"
                            onClick={() => setEditingId(sprint.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete sprint" onClick={() => setConfirmDel(sprint)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setExpandedId(expanded ? null : sprint.id)}>
                            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* expanded ticket list */}
                  {expanded && !editing && (
                    <div className="border-t border-border">
                      {tickets.length === 0 ? (
                        <p className="px-4 py-6 text-xs text-muted-foreground text-center">
                          No tasks in this sprint. Click <ArrowRight className="inline h-3 w-3" /> to assign tasks.
                        </p>
                      ) : (
                        <div className="divide-y divide-border">
                          {tickets.map(t => (
                            <SprintTicketRow key={t.id} ticket={t} sprintId={sprint.id} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* assign tasks modal */}
      {assignModal && (
        <AssignTasksModal
          sprint={assignModal}
          allTickets={allTickets}
          onClose={() => setAssignModal(null)}
        />
      )}

      {/* delete confirm */}
      <ConfirmDialog
        open={confirmDel !== null}
        title="Delete sprint?"
        description={`"${confirmDel?.name}" will be deleted. Tasks in this sprint will be unassigned.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteSprint.isPending}
        onConfirm={async () => {
          if (confirmDel) {
            await deleteSprint.mutateAsync(confirmDel.id)
            setConfirmDel(null)
          }
        }}
        onCancel={() => setConfirmDel(null)}
      />
    </MainLayout>
  )
}

// ── SprintCreateForm ──────────────────────────────────────────────────────────

function SprintCreateForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      goal: '',
      type: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    },
  })
  const create = useCreateSprint()

  const onSubmit = async (data: any) => {
    await create.mutateAsync({ ...data, type: Number(data.type) })
    reset()
    onClose()
  }

  return (
    <Card className="mb-4 border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <p className="text-sm font-semibold">New Sprint</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Sprint name *" {...register('name', { required: true })} />
            <Input placeholder="Goal (optional)" {...register('goal')} />
            <Input type="date" {...register('startDate', { required: true })} />
            <Input type="date" {...register('endDate', { required: true })} />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('type')}
            >
              <option value={1}>Sprint</option>
              <option value={2}>Sustentation</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create Sprint'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── SprintEditForm ────────────────────────────────────────────────────────────

function SprintEditForm({ sprint, onClose }: { sprint: SprintDto; onClose: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name:      sprint.name,
      goal:      sprint.goal ?? '',
      status:    sprint.status,
      startDate: toInputDate(sprint.startDate),
      endDate:   toInputDate(sprint.endDate),
    },
  })
  const update = useUpdateSprint()

  const onSubmit = async (data: any) => {
    await update.mutateAsync({ id: sprint.id, ...data, status: Number(data.status) })
    onClose()
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <p className="text-sm font-semibold">Edit Sprint</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Sprint name *" {...register('name', { required: true })} />
          <Input placeholder="Goal (optional)" {...register('goal')} />
          <Input type="date" {...register('startDate')} />
          <Input type="date" {...register('endDate')} />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('status')}
          >
            <option value={1}>Planning</option>
            <option value={2}>Active</option>
            <option value={3}>Closed</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button type="submit" size="sm" disabled={update.isPending}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── SprintTicketRow ───────────────────────────────────────────────────────────

function SprintTicketRow({ ticket, sprintId }: { ticket: TicketDto; sprintId: string }) {
  const update = useUpdateTicket()

  const removeFromSprint = (e: React.MouseEvent) => {
    e.stopPropagation()
    update.mutate({ id: ticket.id, data: { sprintId: '00000000-0000-0000-0000-000000000000' } })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{ticket.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PRIORITY_COLOR[ticket.priority as Priority])}>
            {PRIORITY_LABEL[ticket.priority as Priority]}
          </span>
          <Badge className={cn('text-[10px] px-1.5 py-0 h-4', STATUS_COLOR[ticket.status])}>
            {STATUS_LABEL[ticket.status as TicketStatus]}
          </Badge>
          {ticket.assignedToUserName && (
            <span className="text-[10px] text-muted-foreground">{ticket.assignedToUserName}</span>
          )}
        </div>
      </div>
      <Button
        variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
        title="Remove from sprint" onClick={removeFromSprint} disabled={update.isPending}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// ── AssignTasksModal ──────────────────────────────────────────────────────────

function AssignTasksModal({ sprint, allTickets, onClose }: {
  sprint: SprintDto
  allTickets: TicketDto[]
  onClose: () => void
}) {
  const update   = useUpdateTicket()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<'all' | 'in-sprint' | 'available'>('all')
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [error, setError]     = useState<string | null>(null)

  // Snapshot the order once so toggling membership doesn't reshuffle/hide rows
  // mid-click — that "items vanish under the cursor" feel was the reported bug.
  const [order] = useState(() => allTickets.map(t => t.id))
  const byId = useMemo(() => new Map(allTickets.map(t => [t.id, t])), [allTickets])

  const inSprintCount = allTickets.filter(t => t.sprintId === sprint.id).length

  const visible = order
    .map(id => byId.get(id))
    .filter((t): t is TicketDto => !!t)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      const isIn = t.sprintId === sprint.id
      if (filter === 'in-sprint') return isIn
      if (filter === 'available') return !isIn
      return true
    })

  const toggle = async (ticket: TicketDto) => {
    if (pending.has(ticket.id)) return
    setError(null)
    setPending(p => new Set(p).add(ticket.id))
    const isInSprint = ticket.sprintId === sprint.id
    try {
      await update.mutateAsync({
        id: ticket.id,
        data: { sprintId: isInSprint ? '00000000-0000-0000-0000-000000000000' : sprint.id },
      })
    } catch {
      setError('Could not update that task. Please try again.')
    } finally {
      setPending(p => { const s = new Set(p); s.delete(ticket.id); return s })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <p className="font-semibold">Manage Tasks</p>
            <p className="text-xs text-muted-foreground">{sprint.name} · click a task to add or remove it</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* filter chips */}
        <div className="flex gap-1 p-2 border-b border-border flex-shrink-0">
          {([
            { id: 'all',       label: `All (${order.length})` },
            { id: 'in-sprint', label: `In sprint (${inSprintCount})` },
            { id: 'available', label: `Available (${order.length - inSprintCount})` },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === f.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* search */}
        <div className="p-2 border-b border-border flex-shrink-0">
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {error && (
          <div className="mx-2 mt-2 px-3 py-2 rounded-md bg-red-500/10 text-red-400 text-xs flex-shrink-0">
            {error}
          </div>
        )}

        {/* list — membership toggles in place; rows never disappear while open */}
        <div className="overflow-y-auto flex-1">
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No tasks found.</p>
          ) : (
            visible.map(ticket => {
              const isIn = ticket.sprintId === sprint.id
              const busy = pending.has(ticket.id)
              return (
                <div
                  key={ticket.id}
                  role="checkbox"
                  aria-checked={isIn}
                  tabIndex={0}
                  onClick={() => toggle(ticket)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(ticket) } }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-border last:border-0',
                    'cursor-pointer hover:bg-muted/40 transition-colors select-none',
                    busy && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isIn ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {isIn && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{ticket.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PRIORITY_COLOR[ticket.priority as Priority])}>
                        {PRIORITY_LABEL[ticket.priority as Priority]}
                      </span>
                      <Badge className={cn('text-[10px] px-1.5 py-0 h-4', STATUS_COLOR[ticket.status])}>
                        {STATUS_LABEL[ticket.status as TicketStatus]}
                      </Badge>
                      {ticket.sprintName && ticket.sprintId !== sprint.id && (
                        <span className="text-[10px] text-muted-foreground italic">
                          in {ticket.sprintName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* footer */}
        <div className="p-3 border-t border-border flex-shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {inSprintCount} task{inSprintCount !== 1 ? 's' : ''} in this sprint
          </span>
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  )
}
