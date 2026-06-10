import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, ChevronDown, Bug, Lightbulb, Wrench, Code2, UserRound, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateTicket, useTickets } from '@/hooks/useTickets'
import { useTenantUsers } from '@/hooks/useUsers'
import { TicketDto, TicketStatus, Priority, TicketType, TYPE_LABEL } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// CSS colour per value — used on the <select> container + each <option>
// so every option in the dropdown shows its own colour, not just the selected one.
const PRIORITY_COLOR: Record<number, string> = {
  [Priority.Critical]: '#f87171', // red-400
  [Priority.High]:     '#fb923c', // orange-400
  [Priority.Medium]:   '#facc15', // yellow-400
  [Priority.Low]:      '#4ade80', // green-400
}

const STATUS_COLOR: Record<number, string> = {
  [TicketStatus.Backlog]:          '#94a3b8', // slate-400
  [TicketStatus.OnGoing]:          '#22d3ee', // cyan-400
  [TicketStatus.Complete]:         '#4ade80', // green-400
  [TicketStatus.Impedido]:         '#f87171', // red-400
  [TicketStatus.GerouBug]:         '#fb923c', // orange-400
  [TicketStatus.InReview]:         '#c084fc', // purple-400
  [TicketStatus.AceitoEmProducao]: '#34d399', // emerald-400
}

const TYPE_ICON: Record<number, React.ElementType> = {
  [TicketType.Bug]:         Bug,
  [TicketType.Feature]:     Lightbulb,
  [TicketType.Improvement]: Wrench,
  [TicketType.TechDebt]:    Code2,
}
const TYPE_COLOR: Record<number, string> = {
  [TicketType.Bug]:         'text-red-400',
  [TicketType.Feature]:     'text-blue-400',
  [TicketType.Improvement]: 'text-yellow-400',
  [TicketType.TechDebt]:    'text-purple-400',
}

interface EditTaskPanelProps {
  open: boolean
  onClose: () => void
  ticket: TicketDto | null
}

interface FormData {
  title: string
  description: string
  impedimentoMotivo: string
  createdAt: string
}

export function EditTaskPanel({ open, onClose, ticket }: EditTaskPanelProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { title: '', description: '', impedimentoMotivo: '', createdAt: '' },
  })
  const { t } = useTranslation()
  const updateTicket               = useUpdateTicket()
  const { data: tenantUsers = [] } = useTenantUsers()
  const { data: allTicketsPage }   = useTickets()
  const allTickets                 = allTicketsPage?.items ?? []

  const [status,   setStatus]   = useState<TicketStatus>(TicketStatus.Backlog)
  const [priority, setPriority] = useState<Priority>(Priority.Medium)

  // AssignedTo combobox
  const [assigneeSearch,   setAssigneeSearch]   = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [showAssigneeList, setShowAssigneeList] = useState(false)

  // BugTicket search
  const [bugSearch,      setBugSearch]      = useState('')
  const [bugTicketId,    setBugTicketId]    = useState<string | null>(null)
  const [bugTicketTitle, setBugTicketTitle] = useState('')
  const [showBugList,    setShowBugList]    = useState(false)

  useEffect(() => {
    if (!ticket) return
    reset({
      title:             ticket.title,
      description:       ticket.description,
      impedimentoMotivo: ticket.impedimentoMotivo ?? '',
      createdAt:         ticket.createdAt ? ticket.createdAt.slice(0, 10) : '',
    })
    setStatus(ticket.status as TicketStatus)
    setPriority(ticket.priority as Priority)

    if (ticket.assignedToUserId && ticket.assignedToUserId !== '00000000-0000-0000-0000-000000000000') {
      setAssignedToUserId(ticket.assignedToUserId)
      setAssigneeSearch(ticket.assignedToUserName ?? '')
    } else if (ticket.assignedToName) {
      setAssignedToUserId('')
      setAssigneeSearch(ticket.assignedToName)
    } else {
      setAssignedToUserId('')
      setAssigneeSearch('')
    }

    if (ticket.bugTicketId) {
      setBugTicketId(ticket.bugTicketId)
      const linked = allTickets.find(t => t.id === ticket.bugTicketId)
      setBugTicketTitle(linked?.title ?? ticket.bugTicketId.slice(0, 8))
      setBugSearch(linked?.title ?? ticket.bugTicketId.slice(0, 8))
    } else {
      setBugTicketId(null); setBugTicketTitle(''); setBugSearch('')
    }
  }, [ticket, reset])

  const isImpedido = status === TicketStatus.Impedido
  const isGerouBug = status === TicketStatus.GerouBug

  const filteredUsers = tenantUsers.filter(u =>
    !assigneeSearch || u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  )
  const filteredBugTickets = allTickets
    .filter(t =>
      t.id !== ticket?.id &&
      (!bugSearch ||
        t.title.toLowerCase().includes(bugSearch.toLowerCase()) ||
        t.id.slice(0, 8).includes(bugSearch))
    )
    .slice(0, 10)

  const onSubmit = async (data: FormData) => {
    if (!ticket) return
    await updateTicket.mutateAsync({
      id: ticket.id,
      data: {
        title:             data.title,
        description:       data.description,
        status,
        priority,
        impedimentoMotivo: isImpedido ? (data.impedimentoMotivo || null) : null,
        bugTicketId:       isGerouBug ? (bugTicketId ?? undefined) : undefined,
        assignedToUserId:  assignedToUserId || '00000000-0000-0000-0000-000000000000',
        assignedToName:    !assignedToUserId && assigneeSearch ? assigneeSearch : '',
        createdAt:         data.createdAt || null,
      },
    })
    onClose()
  }

  if (!open || !ticket) return null

  const TypeIcon  = TYPE_ICON[ticket.type] ?? Bug
  const typeColor = TYPE_COLOR[ticket.type] ?? 'text-muted-foreground'

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-[460px] bg-background border-l border-border z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TypeIcon className={cn('h-4 w-4', typeColor)} />
            <span className="text-sm font-medium text-muted-foreground">
              {TYPE_LABEL[ticket.type as TicketType]}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Título
              </label>
              <Input {...register('title', { required: true })} placeholder="Task title" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Descrição
              </label>
              <textarea
                rows={4}
                {...register('description')}
                placeholder="Detalhes, passos para reproduzir, comportamento esperado..."
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'resize-y overflow-y-auto min-h-[100px] max-h-[300px]'
                )}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('editTask.statusLabel')}
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={e => setStatus(Number(e.target.value) as TicketStatus)}
                  style={{ color: STATUS_COLOR[status] }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-8"
                >
                  <option value={TicketStatus.Backlog}          style={{ color: STATUS_COLOR[TicketStatus.Backlog] }}>
                    {t('status.backlog')}
                  </option>
                  <option value={TicketStatus.OnGoing}          style={{ color: STATUS_COLOR[TicketStatus.OnGoing] }}>
                    {t('status.onGoing')}
                  </option>
                  <option value={TicketStatus.Complete}         style={{ color: STATUS_COLOR[TicketStatus.Complete] }}>
                    {t('status.complete')}
                  </option>
                  <option value={TicketStatus.Impedido}         style={{ color: STATUS_COLOR[TicketStatus.Impedido] }}>
                    {t('status.impedido')}
                  </option>
                  <option value={TicketStatus.GerouBug}         style={{ color: STATUS_COLOR[TicketStatus.GerouBug] }}>
                    {t('status.gerouBug')}
                  </option>
                  <option value={TicketStatus.InReview}         style={{ color: STATUS_COLOR[TicketStatus.InReview] }}>
                    {t('status.inReview')}
                  </option>
                  <option value={TicketStatus.AceitoEmProducao} style={{ color: STATUS_COLOR[TicketStatus.AceitoEmProducao] }}>
                    {t('status.aceitoEmProducao')}
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Motivo do impedimento */}
            {isImpedido && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('editTask.impedimentoMotivo')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register('impedimentoMotivo')}
                  placeholder={t('editTask.impedimentoPlaceholder')}
                  className={cn(
                    'w-full rounded-md border border-red-500/40 bg-background px-3 py-2 text-sm',
                    'placeholder:text-muted-foreground focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'resize-y overflow-y-auto min-h-[80px]'
                  )}
                />
              </div>
            )}

            {/* Bug ticket link */}
            {isGerouBug && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('editTask.bugTicketLink')}
                </label>
                <div
                  className="relative"
                  onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowBugList(false) }}
                >
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={bugSearch}
                    onChange={e => { setBugSearch(e.target.value); setBugTicketId(null); setShowBugList(true) }}
                    onFocus={() => setShowBugList(true)}
                    placeholder={t('editTask.bugTicketPlaceholder')}
                    className="pl-8"
                  />
                  {showBugList && filteredBugTickets.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredBugTickets.map(bt => (
                        <button
                          key={bt.id}
                          type="button"
                          tabIndex={0}
                          onClick={() => {
                            setBugTicketId(bt.id)
                            setBugTicketTitle(bt.title)
                            setBugSearch(bt.title)
                            setShowBugList(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex flex-col"
                        >
                          <span className="font-medium truncate">{bt.title}</span>
                          <span className="text-[10px] text-muted-foreground">{bt.id.slice(0, 8)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {bugTicketId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('editTask.bugLinked')}:{' '}
                    <span className="text-foreground font-medium">{bugTicketTitle}</span>
                  </p>
                )}
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('editTask.priority')}
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value) as Priority)}
                  style={{ color: PRIORITY_COLOR[priority] }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-8"
                >
                  <option value={Priority.Critical} style={{ color: PRIORITY_COLOR[Priority.Critical] }}>
                    {t('priority.critical')}
                  </option>
                  <option value={Priority.High}     style={{ color: PRIORITY_COLOR[Priority.High] }}>
                    {t('priority.high')}
                  </option>
                  <option value={Priority.Medium}   style={{ color: PRIORITY_COLOR[Priority.Medium] }}>
                    {t('priority.medium')}
                  </option>
                  <option value={Priority.Low}      style={{ color: PRIORITY_COLOR[Priority.Low] }}>
                    {t('priority.low')}
                  </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Assigned To — combobox with free-text */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('editTask.assignedTo')}
              </label>
              <div
                className="relative"
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowAssigneeList(false) }}
              >
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={assigneeSearch}
                  onChange={e => { setAssigneeSearch(e.target.value); setAssignedToUserId(''); setShowAssigneeList(true) }}
                  onFocus={() => setShowAssigneeList(true)}
                  placeholder={t('editTask.assignedPlaceholder')}
                  className="pl-8 pr-8"
                />
                {assigneeSearch && (
                  <button
                    type="button"
                    onClick={() => { setAssignedToUserId(''); setAssigneeSearch('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {showAssigneeList && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        tabIndex={0}
                        onClick={() => { setAssignedToUserId(u.id); setAssigneeSearch(u.name); setShowAssigneeList(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                      >
                        <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Created At */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('editTask.created')}
              </label>
              <Input type="date" {...register('createdAt')} />
            </div>

            {/* Metadata */}
            <div className="pt-3 border-t border-border space-y-1.5">
              <MetaRow label={t('editTask.createdBy')} value={ticket.createdByUserName ?? '—'} />
              <MetaRow label={t('editTask.project')}   value={ticket.projectName ?? '—'} />
              {ticket.startedAt && (
                <MetaRow label={t('editTask.started')} value={new Date(ticket.startedAt).toLocaleDateString()} />
              )}
              {ticket.closedAt && (
                <MetaRow label={t('editTask.closed')} value={new Date(ticket.closedAt).toLocaleDateString()} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('editTask.cancel')}
            </Button>
            <Button type="submit" disabled={updateTicket.isPending} className="flex-1">
              {updateTicket.isPending ? t('editTask.saving') : t('editTask.save')}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
