import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X, Bug, Lightbulb, Wrench, Code2, Tag, Clock, ChevronDown, UserRound, SquareKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateTicket } from '@/hooks/useTickets'
import { useProjects } from '@/hooks/useProjects'
import { useTenantUsers } from '@/hooks/useUsers'
import { useSprints } from '@/hooks/useSprints'
import { TicketType, Priority, Severity } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface CreateTaskCardProps {
  open: boolean
  onClose: () => void
  defaultType?: TicketType
}

interface FormData {
  title: string
  description: string
  projectId: string
  estimatedHours: string
  tagInput: string
}

const TYPES = [
  { value: TicketType.Bug,         labelKey: 'ticketType.bug',         icon: Bug,       color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/30'    },
  { value: TicketType.Feature,     labelKey: 'ticketType.feature',     icon: Lightbulb, color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/30'   },
  { value: TicketType.Improvement, labelKey: 'ticketType.improvement', icon: Wrench,    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { value: TicketType.TechDebt,    labelKey: 'ticketType.techDebt',    icon: Code2,     color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
]

const fmtRange = (start: string, end: string) =>
  `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

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

export function CreateTaskCard({ open, onClose, defaultType = TicketType.Bug }: CreateTaskCardProps) {
  const [type, setType]               = useState<TicketType>(defaultType)
  const [priority, setPriority]       = useState<Priority>(Priority.P2)
  const [severity, setSeverity]       = useState<Severity>(Severity.Medium)
  const [tags, setTags]               = useState<string[]>([])
  const [assignedToUserId, setAssignedToUserId] = useState<string>('')
  const [sprintId, setSprintId]       = useState<string>('')

  const { data: projects = [] }    = useProjects()
  const { data: tenantUsers = [] } = useTenantUsers()
  const { data: sprints = [] }     = useSprints()

  // Newest sprint = the one starting furthest out — new tasks default into it
  // so they land in the upcoming iteration instead of the backlog.
  const newestSprint = [...sprints].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )[0]
  const createTicket = useCreateTicket()
  const { t } = useTranslation()
  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', description: '', projectId: '', estimatedHours: '', tagInput: '' },
  })
  const descValue = watch('description')
  const descAutoResize = useAutoResize(descValue)

  const PRIORITIES = [
    { value: Priority.P1, label: t('priority.p1'), color: 'text-red-400' },
    { value: Priority.P2, label: t('priority.p2'), color: 'text-orange-400' },
    { value: Priority.P3, label: t('priority.p3'), color: 'text-yellow-400' },
    { value: Priority.P4, label: t('priority.p4'), color: 'text-green-400' },
  ]

  const SEVERITIES = [
    { value: Severity.Critical, label: t('severity.critical'), color: 'text-red-400' },
    { value: Severity.High,     label: t('severity.high'),     color: 'text-orange-400' },
    { value: Severity.Medium,   label: t('severity.medium'),   color: 'text-yellow-400' },
    { value: Severity.Low,      label: t('severity.low'),      color: 'text-green-400' },
  ]

  // Pre-select first project of the tenant when projects load
  useEffect(() => {
    if (projects.length > 0 && !getValues('projectId')) {
      setValue('projectId', projects[0].id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset and re-apply project default every time the panel opens
  useEffect(() => {
    if (open) {
      setType(defaultType)
      setAssignedToUserId('')
      setSprintId(newestSprint?.id ?? '')
      if (projects.length > 0) {
        setValue('projectId', projects[0].id)
      }
    }
  }, [open, defaultType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sprint list may still be loading when the panel opens — apply the
  // "newest sprint" default as soon as it becomes available.
  useEffect(() => {
    if (open && sprintId === '' && newestSprint) {
      setSprintId(newestSprint.id)
    }
  }, [open, newestSprint?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = getValues('tagInput').trim().toLowerCase()
      if (val && !tags.includes(val)) setTags(prev => [...prev, val])
      setValue('tagInput', '')
    }
  }

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const onSubmit = async (data: FormData) => {
    await createTicket.mutateAsync({
      title: data.title,
      description: data.description,
      type,
      priority,
      severity,
      projectId: data.projectId,
      assignedToUserId: assignedToUserId || null,
      estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      tags,
      sprintId: sprintId || null,
    })
    reset()
    setTags([])
    setPriority(Priority.P2)
    setSeverity(Severity.Medium)
    setAssignedToUserId('')
    setSprintId('')
    onClose()
  }

  if (!open) return null

  const selectedType = TYPES.find(tp => tp.value === type)!

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l border-border z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t('createTask.title')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                {t('createTask.type')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map(tp => {
                  const Icon = tp.icon
                  const active = type === tp.value
                  return (
                    <button
                      key={tp.value}
                      type="button"
                      onClick={() => setType(tp.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition-all',
                        active
                          ? `${tp.bg} ${tp.color} border-current`
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(tp.labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('createTask.taskTitle')}
              </label>
              <Input
                placeholder={t('createTask.titlePlaceholder', { type: t(selectedType.labelKey).toLowerCase() })}
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('createTask.description')}
              </label>
              <textarea
                rows={4}
                placeholder={t('createTask.descPlaceholder')}
                {...register('description', { required: 'Description is required' })}
                ref={el => {
                  register('description').ref(el)
                  ;(descAutoResize.ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
                }}
                onInput={descAutoResize.onInput}
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ring focus-visible:ring-offset-2 resize-none overflow-hidden'
                )}
              />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
            </div>

            {/* Priority + Severity row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('createTask.priority')}
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={e => setPriority(Number(e.target.value) as Priority)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('createTask.severity')}
                </label>
                <div className="relative">
                  <select
                    value={severity}
                    onChange={e => setSeverity(Number(e.target.value) as Severity)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {SEVERITIES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Assigned To
              </label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={assignedToUserId}
                  onChange={e => setAssignedToUserId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t('createTask.unassigned')}</option>
                  {tenantUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Sprint */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Sprint
              </label>
              <div className="relative">
                <SquareKanban className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={sprintId}
                  onChange={e => setSprintId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No sprint</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({fmtRange(s.startDate, s.endDate)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
              {newestSprint && (
                <p className="text-xs text-muted-foreground mt-1">
                  Defaults to the newest sprint — change it if this task belongs elsewhere.
                </p>
              )}
            </div>

            {/* Project + Estimated Hours row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('createTask.project')}
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('projectId', { required: true })}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('createTask.estHours')}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="pl-8"
                    {...register('estimatedHours')}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('createTask.tags')}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder={t('createTask.tagPlaceholder')}
                {...register('tagInput')}
                onKeyDown={addTag}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('createTask.tagHint')}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-background">
            <div className={cn('flex items-center gap-2 text-sm font-medium', selectedType.color)}>
              <selectedType.icon className="h-4 w-4" />
              {t(selectedType.labelKey)}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('createTask.cancel')}
              </Button>
              <Button type="submit" disabled={createTicket.isPending} className="min-w-[100px]">
                {createTicket.isPending ? t('createTask.submitting') : t('createTask.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
