import { useState, useMemo, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateTaskCard } from '@/components/tasks/CreateTaskCard'
import { EditTaskPanel } from '@/components/tasks/EditTaskPanel'
import { ExportMenu } from '@/components/tasks/ExportMenu'
import { ImportPanel } from '@/components/tasks/ImportPanel'
import { useTickets, useUpdateTicket, useDeleteTickets, useMoveTicketsToSprint } from '@/hooks/useTickets'
import { useSprints } from '@/hooks/useSprints'
import { useFeatures } from '@/hooks/useFeatures'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import {
  Plus, Search, Bug, Lightbulb, Wrench, Code2, Layers,
  ShieldAlert, Circle, CheckCircle2, Pencil, ChevronLeft, ChevronRight, ChevronDown,
  Download, FileText, FileSpreadsheet, FileType, CalendarDays, X, Upload, Trash2,
  SquareKanban,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  TicketType, Priority, Severity, TicketStatus, TicketDto, SprintDto,
  PRIORITY_LABEL, SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL,
} from '@/types'
import {
  StatusGroup, STATUS_GROUP_LABEL, STATUS_GROUP_COLOR, inStatusGroup,
} from '@/lib/taskStatus'
import { exportTasksCSV, exportTasksExcel, exportTasksPDF } from '@/lib/export'
import { cn } from '@/lib/utils'

type DateMode = 'created' | 'completed'

// ── helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.P1]: 'text-red-400 bg-red-500/10',
  [Priority.P2]: 'text-orange-400 bg-orange-500/10',
  [Priority.P3]: 'text-yellow-400 bg-yellow-500/10',
  [Priority.P4]: 'text-green-400 bg-green-500/10',
}

const STATUS_COLOR: Record<TicketStatus, string> = {
  [TicketStatus.Backlog]:       'text-slate-300 bg-slate-500/10',
  [TicketStatus.Ready]:         'text-blue-300 bg-blue-500/10',
  [TicketStatus.InProgress]:    'text-cyan-300 bg-cyan-500/10',
  [TicketStatus.Blocked]:       'text-red-300 bg-red-500/10',
  [TicketStatus.WaitingClient]: 'text-purple-300 bg-purple-500/10',
  [TicketStatus.InReview]:      'text-orange-300 bg-orange-500/10',
  [TicketStatus.Done]:          'text-green-300 bg-green-500/10',
  [TicketStatus.Cancelled]:     'text-gray-300 bg-gray-500/10',
}

const TYPE_CONFIG: Record<TicketType, { icon: React.ElementType; color: string }> = {
  [TicketType.Bug]:         { icon: Bug,       color: 'text-red-400' },
  [TicketType.Feature]:     { icon: Lightbulb, color: 'text-blue-400' },
  [TicketType.Improvement]: { icon: Wrench,    color: 'text-yellow-400' },
  [TicketType.TechDebt]:    { icon: Code2,     color: 'text-purple-400' },
}

const TYPE_TABS = [
  { label: 'All',         value: null as TicketType | null,    icon: Layers },
  { label: 'Bugs',        value: TicketType.Bug,               icon: Bug },
  { label: 'Features',    value: TicketType.Feature,           icon: Lightbulb },
  { label: 'Improvements',value: TicketType.Improvement,       icon: Wrench },
  { label: 'Tech Debt',   value: TicketType.TechDebt,          icon: Code2 },
]

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// ── sub-components ────────────────────────────────────────────────────────────

function LoadingRows() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <tr key={i} className="border-b border-border animate-pulse">
          {[20, 48, 12, 20, 24, 20].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div className={`h-4 bg-muted rounded w-${w}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function TypeBadge({ type }: { type: TicketType }) {
  const cfg = TYPE_CONFIG[type]
  const Icon = cfg?.icon ?? Layers
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', cfg?.color)}>
      <Icon className="h-3.5 w-3.5" />
      {TYPE_LABEL[type] ?? type}
    </span>
  )
}

function FeatureSkeletonCard() {
  return (
    <Card className="animate-pulse">
      <div className="p-5 space-y-3">
        <div className="h-5 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    </Card>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function Tasks() {
  const [activeType, setActiveType]     = useState<TicketType | null>(null)
  const [statusGroup, setStatusGroup]   = useState<StatusGroup>('all')
  const [view, setView]                 = useState<'tickets' | 'product-features' | 'planner'>('tickets')
  const [search, setSearch]             = useState('')
  const [createOpen, setCreateOpen]     = useState(false)
  const [createDefault, setCreateDefault] = useState<TicketType>(TicketType.Bug)
  const [editTicket, setEditTicket]     = useState<TicketDto | null>(null)
  const [importOpen, setImportOpen]     = useState(false)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null)

  const deleteTickets = useDeleteTickets()

  // Date range filter
  const [dateMode, setDateMode] = useState<DateMode>('created')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Sprint filter — 'all' | 'no-sprint' | <sprintId>
  const [sprintFilter, setSprintFilter] = useState<string>('all')
  const sprintFilterDefaulted = useRef(false)

  const { user, tenantName } = useAuthStore()
  const { data: ticketPage, isLoading: ticketsLoading, isError: ticketsError } = useTickets()
  const { data: features, isLoading: featuresLoading, isError: featuresError } = useFeatures()
  const { data: sprints = [] } = useSprints()
  const moveToSprint = useMoveTicketsToSprint()

  const allTickets = ticketPage?.items ?? []

  // Counts per type for tab badges
  const counts = {
    [TicketType.Bug]:         allTickets.filter(t => t.type === TicketType.Bug).length,
    [TicketType.Feature]:     allTickets.filter(t => t.type === TicketType.Feature).length,
    [TicketType.Improvement]: allTickets.filter(t => t.type === TicketType.Improvement).length,
    [TicketType.TechDebt]:    allTickets.filter(t => t.type === TicketType.TechDebt).length,
  }

  // Status-group counts for the stat cards
  const statusCounts = useMemo(() => ({
    all:           allTickets.length,
    open:          allTickets.filter(t => inStatusGroup(t.status, 'open')).length,
    'in-progress': allTickets.filter(t => inStatusGroup(t.status, 'in-progress')).length,
    blocked:       allTickets.filter(t => inStatusGroup(t.status, 'blocked')).length,
    done:          allTickets.filter(t => inStatusGroup(t.status, 'done')).length,
    cancelled:     allTickets.filter(t => inStatusGroup(t.status, 'cancelled')).length,
  }), [allTickets])

  // date helper: respects created vs completed mode
  const inDateRange = (t: TicketDto) => {
    if (!dateFrom && !dateTo) return true
    const raw = dateMode === 'created' ? t.createdAt : t.closedAt
    if (!raw) return false // completed filter excludes still-open tasks
    const d = new Date(raw).setHours(0, 0, 0, 0)
    if (dateFrom && d < new Date(dateFrom).setHours(0, 0, 0, 0)) return false
    if (dateTo && d > new Date(dateTo).setHours(23, 59, 59, 999)) return false
    return true
  }

  // Sprints ordered chronologically (oldest → newest) so the switcher can step prev/next
  const sprintsByDate = useMemo(
    () => [...sprints].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [sprints]
  )

  // "Current" sprint = the one whose date range covers today; falls back to the
  // active one, then the nearest upcoming, then the most recent past sprint.
  const currentSprint = useMemo(() => {
    if (sprintsByDate.length === 0) return undefined
    const now = Date.now()
    const inRange = sprintsByDate.find(s =>
      new Date(s.startDate).getTime() <= now && now <= new Date(s.endDate).getTime())
    if (inRange) return inRange
    const active = sprintsByDate.find(s => s.status === 2)
    if (active) return active
    const upcoming = sprintsByDate.find(s => new Date(s.startDate).getTime() > now)
    if (upcoming) return upcoming
    return sprintsByDate[sprintsByDate.length - 1]
  }, [sprintsByDate])

  // Default the switcher to the current sprint once it loads — but only once,
  // so it never overrides a choice the user already made (incl. "All sprints").
  useEffect(() => {
    if (!sprintFilterDefaulted.current && currentSprint) {
      setSprintFilter(currentSprint.id)
      sprintFilterDefaulted.current = true
    }
  }, [currentSprint])

  const matchSprint = (t: TicketDto) => {
    if (sprintFilter === 'all') return true
    if (sprintFilter === 'no-sprint') return !t.sprintId
    return t.sprintId === sprintFilter
  }

  const filtered = useMemo(() => allTickets.filter(t => {
    const matchType   = activeType === null || t.type === activeType
    const matchStatus = inStatusGroup(t.status, statusGroup)
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch && matchSprint(t) && inDateRange(t)
  }), [allTickets, activeType, statusGroup, search, sprintFilter, dateMode, dateFrom, dateTo])

  const openCreateFor = (type: TicketType) => {
    setCreateDefault(type)
    setCreateOpen(true)
  }

  const hasActiveFilters = activeType !== null || statusGroup !== 'all' || !!search || !!dateFrom || !!dateTo || sprintFilter !== 'all'
  const clearFilters = () => {
    setActiveType(null); setStatusGroup('all'); setSearch('')
    setDateFrom(''); setDateTo(''); setShowDateFilter(false)
    setSprintFilter('all')
  }

  // selection helpers
  const allFilteredIds   = filtered.map(t => t.id)
  const allSelected      = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id))
  const someSelected     = allFilteredIds.some(id => selected.has(id))
  const selectedInView   = allFilteredIds.filter(id => selected.has(id))

  const toggleOne = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleAll = () =>
    setSelected(prev => {
      const s = new Set(prev)
      allSelected ? allFilteredIds.forEach(id => s.delete(id)) : allFilteredIds.forEach(id => s.add(id))
      return s
    })

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteTickets.mutateAsync(confirmDelete.ids)
    setSelected(prev => { const s = new Set(prev); confirmDelete.ids.forEach(id => s.delete(id)); return s })
    setConfirmDelete(null)
  }

  const askDeleteSelected = () => {
    const ids = selectedInView
    if (!ids.length) return
    const label = ids.length === 1
      ? `"${filtered.find(t => t.id === ids[0])?.title ?? 'this task'}"`
      : `${ids.length} tasks`
    setConfirmDelete({ ids, label })
  }

  // ── export handlers ──
  const reportMeta = () => {
    const scopeParts: string[] = []
    if (statusGroup !== 'all') scopeParts.push(`Status: ${STATUS_GROUP_LABEL[statusGroup]}`)
    if (activeType !== null) scopeParts.push(`Type: ${TYPE_LABEL[activeType]}`)
    if (search) scopeParts.push(`Search: "${search}"`)
    const dateLabel = (dateFrom || dateTo)
      ? `${dateMode === 'created' ? 'Created' : 'Completed'}: ${dateFrom || '…'} – ${dateTo || '…'}`
      : undefined
    return {
      tenantName: tenantName ?? 'SustainHub',
      generatedBy: user?.name ?? user?.email ?? 'unknown',
      dateFilterLabel: dateLabel,
      scopeLabel: scopeParts.length ? scopeParts.join(' · ') : 'All tasks',
    }
  }

  const { t } = useTranslation()

  return (
    <MainLayout title={t('tasks.title')} subtitle={t('tasks.subtitle')}>

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        {/* View switcher */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 overflow-x-auto">
          {(
            [
              { id: 'tickets',          label: 'Tickets',  labelShort: 'Tickets' },
              { id: 'planner',          label: 'Planner',  labelShort: 'Planner' },
              { id: 'product-features', label: 'Features', labelShort: 'Features' },
            ] as const
          ).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                view === v.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          <ExportMenu
            label="Export"
            icon={Download}
            items={[
              {
                label: 'CSV',
                description: 'Comma-separated, opens in any tool',
                icon: FileType,
                onSelect: () => exportTasksCSV(filtered),
              },
              {
                label: 'Excel (.xls)',
                description: 'Spreadsheet with styled headers',
                icon: FileSpreadsheet,
                onSelect: () => exportTasksExcel(filtered),
              },
              {
                label: 'PDF Report',
                description: 'KPIs + task detail (Save as PDF)',
                icon: FileText,
                onSelect: () => exportTasksPDF(filtered, reportMeta()),
              },
            ]}
          />

          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </div>

      {/* ── TICKETS VIEW ── */}
      {view === 'tickets' && (
        <div className="space-y-4">
          {/* Status summary cards (clickable filters) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['all', 'open', 'in-progress', 'blocked', 'done', 'cancelled'] as StatusGroup[]).map(g => {
              const active = statusGroup === g
              const color = STATUS_GROUP_COLOR[g]
              return (
                <button
                  key={g}
                  onClick={() => setStatusGroup(g)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all',
                    active
                      ? `bg-card border-current ring-2 ${color.ring} ${color.text}`
                      : 'bg-card/50 border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', color.dot)} />
                    <span className={cn('text-2xl font-bold leading-none', active ? color.text : 'text-foreground')}>
                      {statusCounts[g as keyof typeof statusCounts]}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                    {STATUS_GROUP_LABEL[g]}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Date filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <SprintFilterControl
              sprints={sprintsByDate}
              currentSprintId={currentSprint?.id}
              value={sprintFilter}
              onChange={setSprintFilter}
              noSprintCount={allTickets.filter(t => !t.sprintId).length}
            />

            <button
              onClick={() => setShowDateFilter(s => !s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                (dateFrom || dateTo)
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground hover:bg-muted border-border'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {(dateFrom || dateTo)
                ? `${dateMode === 'created' ? 'Created' : 'Completed'}: ${dateFrom || '…'} → ${dateTo || '…'}`
                : 'Date filter'}
            </button>

            {showDateFilter && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-background rounded-md p-0.5 self-start">
                  <button
                    onClick={() => setDateMode('created')}
                    className={cn('px-2 py-1 rounded text-xs font-medium',
                      dateMode === 'created' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
                  >
                    Created
                  </button>
                  <button
                    onClick={() => setDateMode('completed')}
                    className={cn('px-2 py-1 rounded text-xs font-medium',
                      dateMode === 'completed' ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}
                  >
                    Completed
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="h-8 text-xs w-full sm:w-[135px]" />
                  <span className="text-muted-foreground text-xs">→</span>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="h-8 text-xs w-full sm:w-[135px]" />
                  {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"
                      onClick={() => { setDateFrom(''); setDateTo('') }}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground ml-auto"
                onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>

          {/* Type tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Type tabs — scroll horizontal em mobile */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 flex-1 min-w-0">
              {TYPE_TABS.map(tab => {
                const Icon  = tab.icon
                const count = tab.value !== null ? counts[tab.value] : allTickets.length
                const active = activeType === tab.value
                return (
                  <button
                    key={String(tab.value)}
                    onClick={() => setActiveType(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                      active
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label === 'All' ? 'All' : tab.label.slice(0, 3)}</span>
                    <span className={cn(
                      'text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                      active ? 'bg-primary/20' : 'bg-muted'
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Search + quick-create */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm w-full sm:w-44"
                />
              </div>
              <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 h-8 px-2 flex-shrink-0"
                onClick={() => openCreateFor(TicketType.Bug)}>
                <Bug className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10 h-8 px-2 flex-shrink-0"
                onClick={() => openCreateFor(TicketType.Feature)}>
                <Lightbulb className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {ticketsError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Failed to load tasks. Please try again.
            </div>
          )}

          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {ticketsLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                {hasActiveFilters ? 'No tasks match the current filters.' : 'No tasks yet — create your first one!'}
              </p>
            ) : (
              filtered.map(ticket => (
                <TicketMobileCard
                  key={ticket.id}
                  ticket={ticket}
                  sprints={sprints}
                  checked={selected.has(ticket.id)}
                  onToggle={() => toggleOne(ticket.id)}
                  onEdit={() => setEditTicket(ticket)}
                  onDelete={() => setConfirmDelete({ ids: [ticket.id], label: `"${ticket.title}"` })}
                />
              ))
            )}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="pl-4 pr-2 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = !allSelected && someSelected }}
                          onChange={toggleAll}
                          title={allSelected ? 'Deselect all' : 'Select all'}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sprint</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsLoading ? (
                      <LoadingRows />
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                          {hasActiveFilters ? 'No tasks match the current filters.' : 'No tasks yet — create your first one!'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((ticket, idx) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          idx={idx}
                          sprints={sprints}
                          checked={selected.has(ticket.id)}
                          onToggle={() => toggleOne(ticket.id)}
                          onEdit={() => setEditTicket(ticket)}
                          onDelete={() => setConfirmDelete({ ids: [ticket.id], label: `"${ticket.title}"` })}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!ticketsLoading && filtered.length > 0 && (
                <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    {filtered.length} of {allTickets.length} task{allTickets.length !== 1 ? 's' : ''}
                    {statusGroup !== 'all' && ` · ${STATUS_GROUP_LABEL[statusGroup]}`}
                    {activeType !== null && ` · ${TYPE_LABEL[activeType]}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Export reflects these {filtered.length} rows
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PRODUCT FEATURES VIEW ── */}
      {view === 'product-features' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Product surfaces and their stability score
            </p>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Feature Request
            </Button>
          </div>

          {featuresError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Failed to load features.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuresLoading ? (
              [...Array(6)].map((_, i) => <FeatureSkeletonCard key={i} />)
            ) : (features ?? []).length === 0 ? (
              <div className="col-span-3 py-16 text-center text-muted-foreground">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No product features yet.</p>
                <p className="text-xs mt-1">Features appear here when linked to tickets.</p>
              </div>
            ) : (
              (features ?? []).map((feature: any) => (
                <ProductFeatureCard key={feature.id} feature={feature} tickets={allTickets} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── PLANNER VIEW (Kanban) ── */}
      {view === 'planner' && (
        <PlannerView
          tickets={allTickets}
          isLoading={ticketsLoading}
          onEdit={setEditTicket}
          onCreate={() => setCreateOpen(true)}
        />
      )}

      {/* Create Task slide-over */}
      <CreateTaskCard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={createDefault}
      />

      {/* Edit Task slide-over */}
      <EditTaskPanel
        open={editTicket !== null}
        onClose={() => setEditTicket(null)}
        ticket={editTicket}
      />

      {/* Import panel */}
      <ImportPanel
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      {/* Bulk-action floating bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3
                        bg-background border border-border rounded-xl shadow-2xl px-4 py-3
                        animate-in fade-in-0 slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedInView.length} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <BulkSprintMenu
            ids={selectedInView}
            sprints={sprints}
            pending={moveToSprint.isPending}
            onMove={async (sprintId) => {
              await moveToSprint.mutateAsync({ ids: selectedInView, sprintId })
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-8"
            onClick={() => setSelected(new Set())}
          >
            Deselect all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-red-500/10 hover:text-red-400 h-8 gap-1.5"
            onClick={askDeleteSelected}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedInView.length > 1 ? `(${selectedInView.length})` : ''}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete ${confirmDelete?.ids.length === 1 ? 'task' : `${confirmDelete?.ids.length} tasks`}?`}
        description={`${confirmDelete?.label} will be permanently deleted and cannot be recovered.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteTickets.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </MainLayout>
  )
}

// ── TicketMobileCard ──────────────────────────────────────────────────────────

function TicketMobileCard({ ticket, sprints, checked, onToggle, onEdit, onDelete }: {
  ticket: TicketDto
  sprints: SprintDto[]
  checked: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const TypeIcon = TYPE_CONFIG[ticket.type]?.icon ?? Layers
  return (
    <Card
      className={cn('transition-colors cursor-pointer', checked && 'border-primary/40 bg-primary/5')}
      onClick={onEdit}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => { e.stopPropagation(); onToggle() }}
            onClick={e => e.stopPropagation()}
            className="h-4 w-4 mt-0.5 rounded border-border accent-primary cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug line-clamp-2 mb-1.5">{ticket.title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', TYPE_CONFIG[ticket.type]?.color)}>
                <TypeIcon className="h-3 w-3" />
                {TYPE_LABEL[ticket.type]}
              </span>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PRIORITY_COLOR[ticket.priority])}>
                {PRIORITY_LABEL[ticket.priority]}
              </span>
              <Badge className={cn('text-[10px] px-1.5 py-0 h-4', STATUS_COLOR[ticket.status])}>
                {STATUS_LABEL[ticket.status]}
              </Badge>
              <SprintPicker ticket={ticket} sprints={sprints} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {ticket.assignedToUserName ?? '—'} · {fmtDate(ticket.createdAt)}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── TicketRow ─────────────────────────────────────────────────────────────────

function TicketRow({ ticket, idx, sprints, checked, onToggle, onEdit, onDelete }: {
  ticket: TicketDto
  idx: number
  sprints: SprintDto[]
  checked: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const updateTicket = useUpdateTicket()

  const quickMove = (e: React.MouseEvent, toStatus: TicketStatus) => {
    e.stopPropagation()
    updateTicket.mutate({ id: ticket.id, data: { status: toStatus } })
  }

  const nextStatus: Partial<Record<TicketStatus, TicketStatus>> = {
    [TicketStatus.Backlog]:    TicketStatus.Ready,
    [TicketStatus.Ready]:      TicketStatus.InProgress,
    [TicketStatus.InProgress]: TicketStatus.InReview,
    [TicketStatus.InReview]:   TicketStatus.Done,
  }
  const next = nextStatus[ticket.status as TicketStatus]

  return (
    <tr
      className={cn(
        'border-b border-border last:border-0 transition-colors cursor-pointer group',
        checked ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/30'
      )}
      onClick={onEdit}
    >
      {/* Checkbox — stops click-through to row open */}
      <td className="pl-4 pr-2 py-3 w-10" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
        />
      </td>

      <td className="px-4 py-3 max-w-[280px]">
        <span className="font-medium truncate block">{ticket.title}</span>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {ticket.justification && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
              {ticket.status === TicketStatus.Blocked ? '🚫 blocked' : '❌ cancelled'}
            </span>
          )}
          {ticket.tags?.map((tag: string) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </td>

      <td className="px-4 py-3"><TypeBadge type={ticket.type} /></td>

      <td className="px-4 py-3">
        <Badge className={cn('text-xs', PRIORITY_COLOR[ticket.priority as Priority])}>
          {PRIORITY_LABEL[ticket.priority as Priority] ?? ticket.priority}
        </Badge>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Badge className={cn('text-xs', STATUS_COLOR[ticket.status as TicketStatus])}>
            {STATUS_LABEL[ticket.status as TicketStatus] ?? ticket.status}
          </Badge>
          {next !== undefined && (
            <button
              onClick={(e) => quickMove(e, next)}
              title={`Move to ${STATUS_LABEL[next]}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-muted"
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </td>

      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <SprintPicker ticket={ticket} sprints={sprints} />
      </td>

      <td className="px-4 py-3 text-muted-foreground text-xs">
        {ticket.assignedToUserName ?? '—'}
      </td>

      <td className="px-4 py-3 text-muted-foreground text-xs">
        {fmtDate(ticket.createdAt)}
      </td>

      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Edit task"
            className="p-1 rounded hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            title="Delete task"
            className="p-1 rounded hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── SprintPicker — shows current sprint, lets you move the task to another ──

const NO_SPRINT = '00000000-0000-0000-0000-000000000000'

const SPRINT_DOT_COLOR: Record<number, string> = {
  1: 'bg-yellow-400',
  2: 'bg-green-400',
  3: 'bg-slate-400',
}

function SprintPicker({ ticket, sprints }: { ticket: TicketDto; sprints: SprintDto[] }) {
  const update = useUpdateTicket()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (sprintId: string) => {
    setOpen(false)
    if ((ticket.sprintId ?? NO_SPRINT) === sprintId) return
    update.mutate({ id: ticket.id, data: { sprintId } })
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={ticket.sprintName ? `In sprint: ${ticket.sprintName}` : 'Not assigned to a sprint'}
        className={cn(
          'inline-flex items-center gap-1 max-w-[150px] text-[11px] px-1.5 py-0.5 rounded-md border transition-colors',
          ticket.sprintName
            ? 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'
            : 'border-border text-muted-foreground hover:bg-muted'
        )}
      >
        <SquareKanban className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{ticket.sprintName ?? 'No sprint'}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95">
          <button
            onClick={() => pick(NO_SPRINT)}
            className={cn(
              'w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors',
              !ticket.sprintId && 'text-primary font-medium'
            )}
          >
            No sprint
          </button>
          {sprints.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">No sprints yet</p>
          ) : (
            sprints.map(s => (
              <button
                key={s.id}
                onClick={() => pick(s.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors',
                  ticket.sprintId === s.id && 'text-primary font-medium'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', SPRINT_DOT_COLOR[s.status])} />
                <span className="truncate">{s.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── BulkSprintMenu — move every selected task into (or out of) a sprint ──

function BulkSprintMenu({ ids, sprints, pending, onMove }: {
  ids: string[]
  sprints: SprintDto[]
  pending: boolean
  onMove: (sprintId: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = async (sprintId: string) => {
    setOpen(false)
    await onMove(sprintId)
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground h-8 gap-1.5"
        onClick={() => setOpen(o => !o)}
        disabled={pending || ids.length === 0}
      >
        <SquareKanban className="h-3.5 w-3.5" />
        {pending ? 'Moving…' : 'Move to sprint'}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 w-52 rounded-lg border border-border bg-popover shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95">
          <button
            onClick={() => choose(NO_SPRINT)}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
          >
            Remove from sprint
          </button>
          {sprints.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">No sprints yet</p>
          ) : (
            sprints.map(s => (
              <button
                key={s.id}
                onClick={() => choose(s.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', SPRINT_DOT_COLOR[s.status])} />
                <span className="truncate">{s.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── SprintFilterControl — chronological sprint switcher used to filter tasks ──
// Always surfaces the current sprint plus its neighbors: a dropdown lists every
// sprint ordered by date (with the current one flagged), and the chevrons step
// to the previous/next sprint without opening the menu.

function SprintFilterControl({ sprints, currentSprintId, value, onChange, noSprintCount }: {
  sprints: SprintDto[]          // chronological, oldest → newest
  currentSprintId?: string
  value: string                 // 'all' | 'no-sprint' | <sprintId>
  onChange: (v: string) => void
  noSprintCount: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const idx = sprints.findIndex(s => s.id === value)
  const selected = idx >= 0 ? sprints[idx] : undefined

  const step = (dir: -1 | 1) => {
    if (sprints.length === 0) return
    const base = idx >= 0 ? idx : sprints.findIndex(s => s.id === currentSprintId)
    const from = base >= 0 ? base : 0
    const next = sprints[from + dir]
    if (next) onChange(next.id)
  }

  const canStepBack    = sprints.length > 0 && (idx > 0 || (idx === -1 && sprints.findIndex(s => s.id === currentSprintId) > 0))
  const canStepForward = sprints.length > 0 && idx >= 0 && idx < sprints.length - 1

  const label =
    value === 'all'        ? 'All sprints'
    : value === 'no-sprint' ? 'No sprint'
    : selected             ? `${selected.name} · ${fmtDate(selected.startDate)} – ${fmtDate(selected.endDate)}`
    : 'All sprints'

  const isActive = value !== 'all'

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
        disabled={!canStepBack} onClick={() => step(-1)} title="Previous sprint"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors max-w-[260px]',
            isActive
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted-foreground hover:bg-muted border-border'
          )}
        >
          <SquareKanban className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{label}</span>
          {selected && selected.id === currentSprintId && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-primary/15 text-primary flex-shrink-0">Current</span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute left-0 mt-1 w-64 rounded-lg border border-border bg-popover shadow-xl z-50 py-1 max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95">
            <button
              onClick={() => { onChange('all'); setOpen(false) }}
              className={cn('w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors', value === 'all' && 'text-primary font-medium')}
            >
              All sprints
            </button>
            <button
              onClick={() => { onChange('no-sprint'); setOpen(false) }}
              className={cn('w-full flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors', value === 'no-sprint' && 'text-primary font-medium')}
            >
              <span>No sprint</span>
              <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">{noSprintCount}</span>
            </button>

            {sprints.length > 0 && <div className="my-1 border-t border-border" />}

            {sprints.map(s => (
              <button
                key={s.id}
                onClick={() => { onChange(s.id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors',
                  value === s.id && 'text-primary font-medium'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', SPRINT_DOT_COLOR[s.status])} />
                <span className="truncate flex-1">{s.name} · {fmtDate(s.startDate)} – {fmtDate(s.endDate)}</span>
                {s.id === currentSprintId && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-primary/15 text-primary flex-shrink-0">Current</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
        disabled={!canStepForward} onClick={() => step(1)} title="Next sprint"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── ProductFeatureCard ─────────────────────────────────────────────────────────

function ProductFeatureCard({ feature, tickets }: { feature: any; tickets: any[] }) {
  const linked = tickets.filter(t => t.featureId === feature.id)
  const open   = linked.filter(t => t.status !== TicketStatus.Done && t.status !== TicketStatus.Cancelled).length
  const closed = linked.filter(t => t.status === TicketStatus.Done || t.status === TicketStatus.Cancelled).length
  const total  = linked.length

  // Stability: higher open bugs = lower score
  const stability = total === 0 ? 100 : Math.max(0, Math.round(100 - (open / Math.max(total, 1)) * 60))

  const stabilityColor = stability >= 80
    ? 'bg-green-500'
    : stability >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <Card className="hover:border-border/60 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base leading-tight">{feature.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{feature.projectName}</p>
          </div>
          {feature.version && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
              v{feature.version}
            </span>
          )}
        </div>

        {feature.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Stability
            </span>
            <span className="text-sm font-bold">{stability}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn('h-1.5 rounded-full transition-all', stabilityColor)}
              style={{ width: `${stability}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
          <Stat icon={Circle}      label="Open"   value={open}   color="text-red-400" />
          <Stat icon={CheckCircle2} label="Closed" value={closed} color="text-green-400" />
          <Stat icon={Layers}      label="Total"  value={total}  color="text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string
}) {
  return (
    <div className="text-center">
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
        <Icon className="h-2.5 w-2.5" />{label}
      </p>
    </div>
  )
}

// ── PlannerView (Kanban with drag-and-drop) ───────────────────────────────────

const KANBAN_COLUMNS: { status: TicketStatus; label: string; color: string; dot: string }[] = [
  { status: TicketStatus.Backlog,       label: 'Backlog',        color: 'text-slate-400',  dot: 'bg-slate-400'  },
  { status: TicketStatus.Ready,         label: 'Ready',          color: 'text-blue-400',   dot: 'bg-blue-400'   },
  { status: TicketStatus.InProgress,    label: 'In Progress',    color: 'text-cyan-400',   dot: 'bg-cyan-400'   },
  { status: TicketStatus.Blocked,       label: 'Blocked',        color: 'text-red-400',    dot: 'bg-red-400'    },
  { status: TicketStatus.WaitingClient, label: 'Waiting Client', color: 'text-purple-400', dot: 'bg-purple-400' },
  { status: TicketStatus.InReview,      label: 'In Review',      color: 'text-orange-400', dot: 'bg-orange-400' },
  { status: TicketStatus.Done,          label: 'Done',           color: 'text-green-400',  dot: 'bg-green-400'  },
  { status: TicketStatus.Cancelled,     label: 'Cancelled',      color: 'text-gray-400',   dot: 'bg-gray-400'   },
]

function PlannerView({
  tickets,
  isLoading,
  onEdit,
  onCreate,
}: {
  tickets: TicketDto[]
  isLoading: boolean
  onEdit: (t: TicketDto) => void
  onCreate: () => void
}) {
  const updateTicket = useUpdateTicket()
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [overStatus, setOverStatus]   = useState<TicketStatus | null>(null)

  const byStatus = useMemo(() =>
    KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.status] = tickets.filter(t => t.status === col.status)
      return acc
    }, {} as Record<number, TicketDto[]>),
    [tickets]
  )

  const draggingTicket = draggingId ? tickets.find(t => t.id === draggingId) : null

  const handleDragStart = (e: React.DragEvent, ticket: TicketDto) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('ticketId', ticket.id)
    setDraggingId(ticket.id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setOverStatus(null)
  }

  const handleDrop = (e: React.DragEvent, toStatus: TicketStatus) => {
    e.preventDefault()
    const ticketId = e.dataTransfer.getData('ticketId')
    const ticket   = tickets.find(t => t.id === ticketId)
    if (ticket && ticket.status !== toStatus) {
      updateTicket.mutate({ id: ticket.id, data: { status: toStatus } })
    }
    setDraggingId(null)
    setOverStatus(null)
  }

  const moveNext = (ticket: TicketDto, toStatus: TicketStatus) => {
    if (ticket.status !== toStatus)
      updateTicket.mutate({ id: ticket.id, data: { status: toStatus } })
  }

  const NEXT: Partial<Record<TicketStatus, TicketStatus>> = {
    [TicketStatus.Backlog]:       TicketStatus.Ready,
    [TicketStatus.Ready]:         TicketStatus.InProgress,
    [TicketStatus.InProgress]:    TicketStatus.InReview,
    [TicketStatus.WaitingClient]: TicketStatus.InProgress,
    [TicketStatus.InReview]:      TicketStatus.Done,
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLUMNS.map(col => {
          const items    = isLoading ? [] : (byStatus[col.status] ?? [])
          const isOver   = overStatus === col.status
          const isDraggingSame = draggingTicket?.status === col.status

          return (
            <div key={col.status} className="w-[270px] flex-shrink-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', col.dot)} />
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 font-medium">
                    {isLoading ? '…' : items.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={onCreate}
                  title="New task"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverStatus(col.status) }}
                onDragLeave={e => {
                  // only clear if leaving the column entirely
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
                    setOverStatus(null)
                }}
                onDrop={e => handleDrop(e, col.status)}
                className={cn(
                  'space-y-2 min-h-[200px] rounded-xl p-2 border transition-colors duration-150',
                  isOver && !isDraggingSame
                    ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-muted/20 border-border/40'
                )}
              >
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))
                ) : items.length === 0 && !isOver ? (
                  <p className="text-xs text-muted-foreground text-center pt-6 opacity-60">
                    Drop here
                  </p>
                ) : (
                  items.map(ticket => (
                    <KanbanCard
                      key={ticket.id}
                      ticket={ticket}
                      isDragging={draggingId === ticket.id}
                      nextStatus={NEXT[ticket.status]}
                      onEdit={() => onEdit(ticket)}
                      onMoveNext={() => { const ns = NEXT[ticket.status]; if (ns) moveNext(ticket, ns) }}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
                {/* Drop indicator when dragging over a non-empty column */}
                {isOver && !isDraggingSame && (
                  <div className="h-1 rounded-full bg-primary/40 mx-1" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({
  ticket,
  isDragging,
  nextStatus,
  onEdit,
  onMoveNext,
  onDragStart,
  onDragEnd,
}: {
  ticket: TicketDto
  isDragging: boolean
  nextStatus: TicketStatus | undefined
  onEdit: () => void
  onMoveNext: () => void
  onDragStart: (e: React.DragEvent, t: TicketDto) => void
  onDragEnd: () => void
}) {
  const TypeIcon = TYPE_CONFIG[ticket.type]?.icon ?? Layers

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, ticket)}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={cn(
        'bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:border-primary/30 hover:shadow-sm transition-all group',
        isDragging ? 'opacity-40 border-primary/50 shadow-lg scale-95' : 'border-border'
      )}
    >
      {/* Type + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', TYPE_CONFIG[ticket.type]?.color)}>
          <TypeIcon className="h-3 w-3" />
          {TYPE_LABEL[ticket.type]}
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PRIORITY_COLOR[ticket.priority])}>
          {PRIORITY_LABEL[ticket.priority]}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{ticket.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">
          {ticket.assignedToUserName ?? ticket.createdByUserName ?? '—'}
        </span>
        {nextStatus !== undefined && (
          <button
            onClick={e => { e.stopPropagation(); onMoveNext() }}
            title={`Move to ${STATUS_LABEL[nextStatus]}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
}
