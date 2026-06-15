import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { X, Bug, Lightbulb, Wrench, Code2, Tag, ChevronDown, UserRound, SquareKanban, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateTicket, useSuggestPriority } from '@/hooks/useTickets'
import { useProjects } from '@/hooks/useProjects'
import { useTenantUsers } from '@/hooks/useUsers'
import { useSprints } from '@/hooks/useSprints'
import { TicketType, Priority } from '@/types'
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
  tagInput: string
}

const TYPES = [
  { value: TicketType.Bug,         labelKey: 'ticketType.bug',         icon: Bug,       color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-500/10    border-red-500/30'    },
  { value: TicketType.Feature,     labelKey: 'ticketType.feature',     icon: Lightbulb, color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-500/10   border-blue-500/30'   },
  { value: TicketType.Improvement, labelKey: 'ticketType.improvement', icon: Wrench,    color: 'text-amber-600 dark:text-yellow-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { value: TicketType.TechDebt,    labelKey: 'ticketType.techDebt',    icon: Code2,     color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
]

const PRIORITY_CONFIG = [
  { value: Priority.Critical, label: 'Critical', color: 'text-red-600 dark:text-red-400',    desc: 'Produção indisponível ou bloqueio grave' },
  { value: Priority.High,     label: 'High',     color: 'text-orange-600 dark:text-orange-400', desc: 'Impacto em funcionalidade principal' },
  { value: Priority.Medium,   label: 'Medium',   color: 'text-amber-600 dark:text-yellow-400', desc: 'Problema parcial com contorno disponível' },
  { value: Priority.Low,      label: 'Low',      color: 'text-green-600 dark:text-green-400',  desc: 'Ajuste visual, melhoria de baixa urgência' },
]

const fmtRange = (start: string, end: string) =>
  `${new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

export function CreateTaskCard({ open, onClose, defaultType = TicketType.Bug }: CreateTaskCardProps) {
  const [type, setType]               = useState<TicketType>(defaultType)
  const [priority, setPriority]       = useState<Priority>(Priority.Medium)
  const [suggestedPriority, setSuggestedPriority] = useState<Priority | null>(null)
  const [tags, setTags]               = useState<string[]>([])

  // AssignedTo: pick from dropdown OR type freely
  const [assigneeSearch, setAssigneeSearch]     = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [showAssigneeList, setShowAssigneeList] = useState(false)

  const [sprintId, setSprintId]       = useState<string>('')

  const { data: projects = [] }    = useProjects()
  const { data: tenantUsers = [] } = useTenantUsers()
  const { data: sprints = [] }     = useSprints()

  const newestSprint = [...sprints].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )[0]

  const createTicket   = useCreateTicket()
  const suggestPriority = useSuggestPriority()
  const { t } = useTranslation()
  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { title: '', description: '', projectId: '', tagInput: '' },
  })

  const titleValue = watch('title')
  const descValue  = watch('description')

  // Auto-suggest priority when title+description are meaningful
  const suggestRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (suggestRef.current) clearTimeout(suggestRef.current)
    if (titleValue.length < 5) { setSuggestedPriority(null); return }
    suggestRef.current = setTimeout(async () => {
      try {
        const result = await suggestPriority.mutateAsync({ title: titleValue, description: descValue })
        setSuggestedPriority(result.priority)
      } catch { /* silently ignore */ }
    }, 1000)
    return () => { if (suggestRef.current) clearTimeout(suggestRef.current) }
  }, [titleValue, descValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const applySuggestion = () => {
    if (suggestedPriority !== null) {
      setPriority(suggestedPriority)
      setSuggestedPriority(null)
    }
  }

  // Pre-select first project
  useEffect(() => {
    if (projects.length > 0 && !getValues('projectId')) {
      setValue('projectId', projects[0].id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on open
  useEffect(() => {
    if (open) {
      setType(defaultType)
      setAssigneeSearch('')
      setAssignedToUserId('')
      setSprintId(newestSprint?.id ?? '')
      setSuggestedPriority(null)
      if (projects.length > 0) setValue('projectId', projects[0].id)
    }
  }, [open, defaultType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && sprintId === '' && newestSprint) setSprintId(newestSprint.id)
  }, [open, newestSprint?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = tenantUsers.filter(u =>
    assigneeSearch === '' || u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  )

  const selectUser = (userId: string, name: string) => {
    setAssignedToUserId(userId)
    setAssigneeSearch(name)
    setShowAssigneeList(false)
  }

  const clearAssignee = () => {
    setAssignedToUserId('')
    setAssigneeSearch('')
  }

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
      projectId: data.projectId,
      assignedToUserId: assignedToUserId || null,
      assignedToName: !assignedToUserId && assigneeSearch ? assigneeSearch : null,
      tags,
      sprintId: sprintId || null,
    })
    reset()
    setTags([])
    setPriority(Priority.Medium)
    setSuggestedPriority(null)
    setAssigneeSearch('')
    setAssignedToUserId('')
    setSprintId('')
    onClose()
  }

  if (!open) return null

  const selectedType = TYPES.find(tp => tp.value === type)!
  const currentPrioConfig = PRIORITY_CONFIG.find(p => p.value === priority)!
  const suggestedPrioConfig = suggestedPriority !== null
    ? PRIORITY_CONFIG.find(p => p.value === suggestedPriority)
    : null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 flex flex-col shadow-2xl">
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

            {/* Description — resize + scroll */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                {t('createTask.description')}
              </label>
              <textarea
                rows={5}
                placeholder={t('createTask.descPlaceholder')}
                {...register('description', { required: 'Description is required' })}
                className={cn(
                  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ring focus-visible:ring-offset-2',
                  'resize-y overflow-y-auto min-h-[100px] max-h-[300px]'
                )}
              />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
            </div>

            {/* Priority */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('createTask.priority')}
                </label>
                {suggestedPrioConfig && (
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors',
                      'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI suggests: <span className={cn('font-semibold ml-0.5', suggestedPrioConfig.color)}>{suggestedPrioConfig.label}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_CONFIG.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg border text-xs transition-all text-left',
                      priority === p.value
                        ? `border-current bg-muted/40 ${p.color}`
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    )}
                  >
                    <span className={cn('font-semibold', priority === p.value ? p.color : '')}>{p.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assigned To — combobox with free text fallback */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Assigned To
              </label>
              <div className="relative" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowAssigneeList(false) }}>
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={assigneeSearch}
                  onChange={e => {
                    setAssigneeSearch(e.target.value)
                    setAssignedToUserId('')
                    setShowAssigneeList(true)
                  }}
                  onFocus={() => setShowAssigneeList(true)}
                  placeholder="Name or @mention..."
                  className="pl-8"
                />
                {assigneeSearch && (
                  <button type="button" onClick={clearAssignee}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {showAssigneeList && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        tabIndex={0}
                        onClick={() => selectUser(u.id, u.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"
                      >
                        <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {assignedToUserId && (
                <p className="text-xs text-muted-foreground mt-1">Registered user selected</p>
              )}
              {!assignedToUserId && assigneeSearch && (
                <p className="text-xs text-muted-foreground mt-1">Will be saved as free-text name</p>
              )}
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
            </div>

            {/* Project */}
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
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-card">
            <div className={cn('flex items-center gap-2 text-sm font-medium', currentPrioConfig.color)}>
              <selectedType.icon className="h-4 w-4" />
              <span>{t(selectedType.labelKey)}</span>
              <span className="text-xs opacity-70">· {currentPrioConfig.label}</span>
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
