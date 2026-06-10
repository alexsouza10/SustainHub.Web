import { useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X, ChevronDown, Bug, Lightbulb, Wrench, Code2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateTicket } from '@/hooks/useTickets'
import { useTenantUsers } from '@/hooks/useUsers'
import { TicketDto, TicketStatus, Priority, Severity, TicketType, TYPE_LABEL } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface EditTaskPanelProps {
  open: boolean
  onClose: () => void
  ticket: TicketDto | null
}

interface FormData {
  title: string
  description: string
  status: number
  priority: number
  severity: number
  estimatedHours: string
  justification: string
  assignedToUserId: string
  createdAt: string
}

// No conversion needed — we send numeric values directly to the API
// (UpdateTicketRequest accepts nullable enums deserialized from integers)

const STATUS_COLOR: Record<number, string> = {
  [TicketStatus.Backlog]:       'text-slate-400',
  [TicketStatus.Ready]:         'text-blue-400',
  [TicketStatus.InProgress]:    'text-cyan-400',
  [TicketStatus.Blocked]:       'text-red-400',
  [TicketStatus.WaitingClient]: 'text-purple-400',
  [TicketStatus.InReview]:      'text-orange-400',
  [TicketStatus.Done]:          'text-green-400',
  [TicketStatus.Cancelled]:     'text-gray-400',
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

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])
  useEffect(() => { resize() }, [value, resize])
  return { ref, onInput: resize }
}

export function EditTaskPanel({ open, onClose, ticket }: EditTaskPanelProps) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      status: TicketStatus.Backlog,
      priority: Priority.P2,
      severity: Severity.Medium,
      estimatedHours: '',
      justification: '',
      assignedToUserId: '',
      createdAt: '',
    },
  })

  const updateTicket = useUpdateTicket()
  const { data: tenantUsers = [] } = useTenantUsers()

  // Reset form whenever the selected ticket changes or users finish loading
  useEffect(() => {
    if (ticket) {
      reset({
        title:            ticket.title,
        description:      ticket.description,
        status:           ticket.status,
        priority:         ticket.priority,
        severity:         ticket.severity,
        estimatedHours:   ticket.estimatedHours?.toString() ?? '',
        justification:    ticket.justification ?? '',
        assignedToUserId: ticket.assignedToUserId && ticket.assignedToUserId !== '00000000-0000-0000-0000-000000000000'
          ? ticket.assignedToUserId
          : '',
        createdAt:        ticket.createdAt ? ticket.createdAt.slice(0, 10) : '',
      })
    }
  }, [ticket, reset, tenantUsers])
  const { t } = useTranslation()
  const status = watch('status')
  const descValue = watch('description')
  const needsJustification = status === TicketStatus.Blocked || status === TicketStatus.Cancelled
  const descAutoResize = useAutoResize(descValue)

  const onSubmit = async (data: FormData) => {
    if (!ticket) return
    await updateTicket.mutateAsync({
      id: ticket.id,
      data: {
        title:            data.title,
        description:      data.description,
        status:           Number(data.status),
        priority:         Number(data.priority),
        severity:         Number(data.severity),
        estimatedHours:   data.estimatedHours ? parseFloat(data.estimatedHours) : null,
        justification:    needsJustification ? data.justification : null,
        assignedToUserId: data.assignedToUserId || '00000000-0000-0000-0000-000000000000',
        createdAt:        data.createdAt || null,
      },
    })
    onClose()
  }

  if (!open || !ticket) return null

  const TypeIcon = TYPE_ICON[ticket.type] ?? Bug

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[460px] bg-background border-l border-border z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TypeIcon className={cn('h-4 w-4', TYPE_COLOR[ticket.type])} />
            <span className="text-sm font-medium text-muted-foreground">{TYPE_LABEL[ticket.type as TicketType]}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Ticket / Título</label>
              <Input {...register('title', { required: true })} placeholder="Task title" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.statusLabel').replace('Status', 'Description')}</label>
              <textarea
                rows={4}
                {...register('description')}
                ref={el => {
                  register('description').ref(el)
                  ;(descAutoResize.ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
                }}
                onInput={descAutoResize.onInput}
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-hidden',
                  'placeholder:text-muted-foreground focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.statusLabel')}</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setValue('status', parseInt(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value={TicketStatus.Backlog}>{t('status.backlog')}</option>
                  <option value={TicketStatus.Ready}>{t('status.ready')}</option>
                  <option value={TicketStatus.InProgress}>{t('status.inProgress')}</option>
                  <option value={TicketStatus.Blocked}>{t('status.blocked')}</option>
                  <option value={TicketStatus.WaitingClient}>{t('status.waitingClient')}</option>
                  <option value={TicketStatus.InReview}>{t('status.inReview')}</option>
                  <option value={TicketStatus.Done}>{t('status.done')}</option>
                  <option value={TicketStatus.Cancelled}>{t('status.cancelled')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Justification — required when Blocked or Cancelled */}
            {needsJustification && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('editTask.justification')}
                  <span className="text-red-400 ml-1">{t('editTask.justRequired')}</span>
                </label>
                <textarea
                  rows={3}
                  {...register('justification', { required: needsJustification })}
                  placeholder={
                    status === TicketStatus.Blocked
                      ? t('editTask.blockedPlaceholder')
                      : t('editTask.cancelledPlaceholder')
                  }
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y',
                    'placeholder:text-muted-foreground focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    status === TicketStatus.Blocked ? 'border-red-500/40' : 'border-gray-500/40'
                  )}
                />
              </div>
            )}

            {/* Show existing justification if not currently editing blocked/cancelled */}
            {!needsJustification && ticket.justification && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Previous justification</p>
                <p className="text-sm">{ticket.justification}</p>
              </div>
            )}

            {/* Priority + Severity row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.priority')}</label>
                <div className="relative">
                  <select
                    {...register('priority', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value={Priority.P1}>{t('priority.p1')}</option>
                    <option value={Priority.P2}>{t('priority.p2')}</option>
                    <option value={Priority.P3}>{t('priority.p3')}</option>
                    <option value={Priority.P4}>{t('priority.p4')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.severity')}</label>
                <div className="relative">
                  <select
                    {...register('severity', { valueAsNumber: true })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value={Severity.Critical}>{t('severity.critical')}</option>
                    <option value={Severity.High}>{t('severity.high')}</option>
                    <option value={Severity.Medium}>{t('severity.medium')}</option>
                    <option value={Severity.Low}>{t('severity.low')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.assignedTo')}</label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  {...register('assignedToUserId')}
                  className="w-full rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t('editTask.unassigned')}</option>
                  {tenantUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Estimated hours */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('editTask.estHours')}</label>
              <Input type="number" min="0" step="0.5" placeholder="0" {...register('estimatedHours')} />
            </div>

            {/* Created At (editable) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('editTask.created')}
              </label>
              <Input type="date" {...register('createdAt')} />
            </div>

            {/* Metadata */}
            <div className="pt-3 border-t border-border space-y-1">
              <MetaRow label={t('editTask.createdBy')} value={ticket.createdByUserName} />
              <MetaRow label={t('editTask.project')}   value={ticket.projectName} />
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
