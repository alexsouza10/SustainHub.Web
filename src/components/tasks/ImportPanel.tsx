import { useState, useRef, useCallback } from 'react'
import { X, Upload, Mail, FileSpreadsheet, CheckCircle2, AlertCircle, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useProjects } from '@/hooks/useProjects'
import { useImportTickets } from '@/hooks/useImport'
import {
  ParsedRow, ParseResult,
  parseFileContent, parseEmailText,
  detectType, detectPriority,
} from '@/lib/importParse'
import { TicketType, Priority, TYPE_LABEL, PRIORITY_LABEL } from '@/types'
import { cn } from '@/lib/utils'

type Tab    = 'file' | 'email'
type Step   = 'input' | 'preview' | 'done'

interface ImportPanelProps {
  open: boolean
  onClose: () => void
}

const TYPE_COLOR: Record<number, string> = {
  [TicketType.Bug]:         'bg-red-500/10 text-red-400',
  [TicketType.Feature]:     'bg-blue-500/10 text-blue-400',
  [TicketType.Improvement]: 'bg-yellow-500/10 text-yellow-400',
  [TicketType.TechDebt]:    'bg-purple-500/10 text-purple-400',
}
const PRIO_COLOR: Record<number, string> = {
  [Priority.Critical]: 'bg-red-500/10 text-red-400',
  [Priority.High]:     'bg-orange-500/10 text-orange-400',
  [Priority.Medium]:   'bg-yellow-500/10 text-yellow-400',
  [Priority.Low]:      'bg-green-500/10 text-green-400',
}

export function ImportPanel({ open, onClose }: ImportPanelProps) {
  const [tab, setTab]         = useState<Tab>('file')
  const [step, setStep]       = useState<Step>('input')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [rows, setRows]       = useState<ParsedRow[]>([])
  const [emailText, setEmailText] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dragging, setDragging] = useState(false)
  const [filename, setFilename] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [doneResult, setDoneResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const { data: projects = [] } = useProjects()
  const importMutation = useImportTickets()

  // Set default project on load
  if (!projectId && projects.length > 0) setProjectId(projects[0].id)

  const reset = () => {
    setStep('input'); setParseResult(null); setRows([])
    setEmailText(''); setFilename(''); setEditIdx(null); setDoneResult(null)
  }

  const handleClose = () => { reset(); onClose() }

  // ── File handling ────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer
      const result = parseFileContent(buffer, file.name)
      setParseResult(result)
      setRows(result.rows)
      setStep('preview')
    }
    // SheetJS needs ArrayBuffer for all formats (CSV, XLS, XLSX)
    reader.readAsArrayBuffer(file)
  }

  const onFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ── Email handling ───────────────────────────────────────────────────────

  const parseEmail = () => {
    if (!emailText.trim()) return
    const row = parseEmailText(emailText)
    if (row) {
      setRows([row])
      setStep('preview')
    }
  }

  // ── Row editing ──────────────────────────────────────────────────────────

  const updateRow = (idx: number, field: keyof ParsedRow, val: unknown) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!projectId || rows.length === 0) return
    const result = await importMutation.mutateAsync({ rows, projectId })
    setDoneResult(result)
    setStep('done')
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l border-border z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Import Tasks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'input'   && 'Upload a spreadsheet, paste email content, or add rows manually'}
              {step === 'preview' && `${rows.length} row${rows.length !== 1 ? 's' : ''} ready — review before importing`}
              {step === 'done'    && 'Import complete'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* ── STEP: INPUT ── */}
        {step === 'input' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
              {(['file', 'email'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                    tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t === 'file'  && <><FileSpreadsheet className="h-4 w-4" /> Spreadsheet / CSV</>}
                  {t === 'email' && <><Mail className="h-4 w-4" /> Email</>}
                </button>
              ))}
            </div>

            {/* File tab */}
            {tab === 'file' && (
              <div className="space-y-4">
                {/* Drag-drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onFileDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                    dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/20'
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV, TSV, Excel (.xlsx / .xls), OpenDocument (.ods)</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.tsv,.xls,.xlsx,.ods,.txt"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>

                {/* Format tips */}
                <div className="rounded-lg bg-muted/30 border border-border p-4 text-xs space-y-2">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wider">Expected columns (case-insensitive)</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-muted-foreground">
                    <span><span className="font-medium text-foreground">Title</span> — task name (required)</span>
                    <span><span className="font-medium text-foreground">Type</span> — Bug, Feature, Improvement, Tech Debt</span>
                    <span><span className="font-medium text-foreground">Priority</span> — Critical, High, Medium, Low</span>
                    <span><span className="font-medium text-foreground">Description</span> — optional text</span>
                    <span><span className="font-medium text-foreground">Tags</span> — comma or semicolon separated</span>
                  </div>
                  <p className="text-muted-foreground/70 pt-1">Unknown columns are ignored. You can use our exported CSV directly.</p>
                </div>
              </div>
            )}

            {/* Email tab */}
            {tab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Paste email content
                  </label>
                  <textarea
                    rows={14}
                    value={emailText}
                    onChange={e => setEmailText(e.target.value)}
                    placeholder={`Subject: Login button broken on mobile\nFrom: user@client.com\nTo: dev@yourcompany.com\n\nHi team,\n\nWhen tapping the login button on iPhone, the app crashes immediately.\nSteps to reproduce:\n1. Open app\n2. Enter credentials\n3. Tap Login\n\nExpected: navigate to dashboard\nActual: crash / white screen\n\nPriority: High\nDevice: iPhone 14 / iOS 17`}
                    className={cn(
                      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none',
                      'placeholder:text-muted-foreground/50 focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono text-xs'
                    )}
                  />
                </div>
                <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
                  <p>The system will extract the <strong className="text-foreground">subject</strong> as the title and auto-detect the type and priority from the body.</p>
                  <p>You can review and edit all fields before importing.</p>
                </div>
                <Button onClick={parseEmail} disabled={!emailText.trim()} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Parse Email
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Parse errors */}
            {parseResult?.errors && parseResult.errors.length > 0 && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {parseResult.errors.length} row(s) skipped</p>
                {parseResult.errors.slice(0, 3).map((e, i) => <p key={i}>{e.message}</p>)}
              </div>
            )}

            {rows.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No valid rows to import. Go back and check your file.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-2">
                {rows.map((row, idx) => (
                  <PreviewRow
                    key={idx}
                    row={row}
                    idx={idx}
                    isEditing={editIdx === idx}
                    onEdit={() => setEditIdx(editIdx === idx ? null : idx)}
                    onUpdate={(f, v) => updateRow(idx, f, v)}
                    onRemove={() => removeRow(idx)}
                  />
                ))}
              </div>
            )}

            {/* Project selector */}
            <div className="px-6 py-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Project</label>
                <div className="relative flex-1">
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && doneResult && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-4">
            <div className={cn('rounded-full p-4', doneResult.failed === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10')}>
              <CheckCircle2 className={cn('h-12 w-12', doneResult.failed === 0 ? 'text-green-400' : 'text-yellow-400')} />
            </div>
            <div>
              <p className="text-2xl font-bold">{doneResult.created} imported</p>
              {doneResult.failed > 0 && (
                <p className="text-muted-foreground text-sm mt-1">{doneResult.failed} failed</p>
              )}
            </div>
            {doneResult.errors.length > 0 && (
              <div className="w-full rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-left space-y-1">
                {doneResult.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reset}>Import more</Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}

        {/* Footer */}
        {step !== 'done' && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-background">
            <Button variant="ghost" onClick={step === 'preview' ? reset : handleClose}>
              {step === 'preview' ? 'Back' : 'Cancel'}
            </Button>
            {step === 'preview' && (
              <Button
                onClick={handleImport}
                disabled={rows.length === 0 || !projectId || importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing…' : `Import ${rows.length} task${rows.length !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── PreviewRow ─────────────────────────────────────────────────────────────

function PreviewRow({
  row, idx, isEditing, onEdit, onUpdate, onRemove,
}: {
  row: ParsedRow
  idx: number
  isEditing: boolean
  onEdit: () => void
  onUpdate: (f: keyof ParsedRow, v: unknown) => void
  onRemove: () => void
}) {
  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      isEditing ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
    )}>
      {/* Collapsed row */}
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-xs text-muted-foreground font-mono w-5 text-center">{idx + 1}</span>
        <Badge className={cn('text-[10px] px-1.5 flex-shrink-0', TYPE_COLOR[row.type])}>
          {TYPE_LABEL[row.type as TicketType]}
        </Badge>
        <span className="text-sm font-medium flex-1 truncate">{row.title}</span>
        <Badge className={cn('text-[10px] px-1.5 flex-shrink-0', PRIO_COLOR[row.priority])}>
          {PRIORITY_LABEL[row.priority as Priority]}
        </Badge>
        <button onClick={onEdit} className="p-1 rounded hover:bg-muted transition-colors">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Expanded editor */}
      {isEditing && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          <Input
            value={row.title}
            onChange={e => onUpdate('title', e.target.value)}
            placeholder="Title"
            className="text-sm"
          />
          <textarea
            rows={3}
            value={row.description}
            onChange={e => onUpdate('description', e.target.value)}
            placeholder="Description"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Type</label>
              <select
                value={row.type}
                onChange={e => onUpdate('type', parseInt(e.target.value) as TicketType)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={TicketType.Bug}>Bug</option>
                <option value={TicketType.Feature}>Feature</option>
                <option value={TicketType.Improvement}>Improvement</option>
                <option value={TicketType.TechDebt}>Tech Debt</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Priority</label>
              <select
                value={row.priority}
                onChange={e => onUpdate('priority', parseInt(e.target.value) as Priority)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={Priority.Critical}>Critical</option>
                <option value={Priority.High}>High</option>
                <option value={Priority.Medium}>Medium</option>
                <option value={Priority.Low}>Low</option>
              </select>
            </div>
          </div>
          <Input
            value={row.tags.join(', ')}
            onChange={e => onUpdate('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
            placeholder="Tags (comma separated)"
            className="text-xs"
          />
        </div>
      )}
    </div>
  )
}
