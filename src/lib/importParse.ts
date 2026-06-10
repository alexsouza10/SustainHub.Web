import * as XLSX from 'xlsx'
import { TicketType, Priority } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedRow {
  title: string
  description: string
  type: TicketType
  priority: Priority
  tags: string[]
  _raw?: Record<string, string>
}

export interface ParseError {
  row: number
  message: string
}

export interface ParseResult {
  rows: ParsedRow[]
  errors: ParseError[]
  rawHeaders?: string[]
}

// ── Value detectors ──────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, TicketType> = {
  // English
  bug: TicketType.Bug, defect: TicketType.Bug, error: TicketType.Bug,
  issue: TicketType.Bug, crash: TicketType.Bug, incident: TicketType.Bug,
  feature: TicketType.Feature, enhancement: TicketType.Feature,
  'feature request': TicketType.Feature, story: TicketType.Feature,
  improvement: TicketType.Improvement, refactor: TicketType.Improvement,
  cleanup: TicketType.Improvement, chore: TicketType.Improvement,
  'tech debt': TicketType.TechDebt, techdebt: TicketType.TechDebt,
  // Portuguese
  'erro': TicketType.Bug, 'defeito': TicketType.Bug, 'problema': TicketType.Bug,
  'funcionalidade': TicketType.Feature, 'melhoria': TicketType.Improvement,
  'dívida técnica': TicketType.TechDebt,
}

const PRIORITY_MAP: Record<string, Priority> = {
  // English / new names
  critical: Priority.Critical, urgent: Priority.Critical, blocker: Priority.Critical, '1': Priority.Critical,
  high: Priority.High, '2': Priority.High,
  medium: Priority.Medium, normal: Priority.Medium, '3': Priority.Medium,
  low: Priority.Low, minor: Priority.Low, '4': Priority.Low,
  // Legacy P1-P4 aliases
  p1: Priority.Critical, p2: Priority.High, p3: Priority.Medium, p4: Priority.Low,
  // Portuguese
  'crítico': Priority.Critical, 'critico': Priority.Critical, 'alto': Priority.High,
  'médio': Priority.Medium, 'medio': Priority.Medium, 'baixo': Priority.Low,
}

// Status from spreadsheet → TicketStatus number (for informational use only,
// we always import as Backlog and let users change later)
export const STATUS_IMPORT_MAP: Record<string, number> = {
  completo: 7, complete: 7, done: 7, concluído: 7, finalizado: 7, ok: 7,
  'a fazer': 1, todo: 1, backlog: 1, pendente: 1, 'to do': 1,
  'em andamento': 3, 'in progress': 3, doing: 3, 'em progresso': 3,
  bloqueado: 4, blocked: 4, impedido: 4,
  cancelado: 8, cancelled: 8, canceled: 8,
}

export function detectType(s: string): TicketType {
  return TYPE_MAP[s.trim().toLowerCase()] ?? TicketType.Bug
}
export function detectPriority(s: string): Priority {
  return PRIORITY_MAP[s.trim().toLowerCase()] ?? Priority.Medium
}

// Detect type from free text (title + body) — used for email parsing
export function detectTypeFromText(text: string): TicketType {
  const lc = text.toLowerCase()
  if (/\b(crash|error|bug|broken|fail|defect|not work|crítico|erro)\b/.test(lc)) return TicketType.Bug
  if (/\b(feature|request|enhanc|add |want |funcionalidade|melhoria)\b/.test(lc)) return TicketType.Feature
  if (/\b(improve|refactor|cleanup|optim|perfo|usabilidade)\b/.test(lc)) return TicketType.Improvement
  if (/\b(debt|legacy|technical|todo:|fixme:|dívida)\b/.test(lc)) return TicketType.TechDebt
  return TicketType.Bug
}

export function detectPriorityFromText(text: string): Priority {
  const lc = text.toLowerCase()
  if (/\b(critical|urgent|blocker|p0|p1|high.priority|crítico|critico)\b/.test(lc)) return Priority.Critical
  if (/\b(high|important|p2|funcionalidade)\b/.test(lc)) return Priority.High
  if (/\b(low|minor|p4|trivial|nitpick|interface|baixo)\b/.test(lc)) return Priority.Low
  return Priority.Medium
}

// ── Column auto-mapper ────────────────────────────────────────────────────────

// Maps a raw column header (normalized) → internal field name
const HEADER_ALIASES: Record<string, string> = {
  // Title aliases
  title: 'title', name: 'title', subject: 'title', summary: 'title', task: 'title',
  // Portuguese title aliases (Queenston tracker style)
  'localização': 'title', 'localizacao': 'title', 'local': 'title',
  'especificação': 'description', 'especificacao': 'description',
  'especificação_do_item_a_ser_melhorado': 'description',
  'especificação_do_item_a_ser_corrigido': 'description',
  'item': 'title', 'tarefa': 'title',
  // Description
  description: 'description', desc: 'description', body: 'description',
  detail: 'description', details: 'description', notes: 'description',
  // Type
  type: 'type', kind: 'type', category: 'type', issue_type: 'type',
  tipo: 'type',
  // Priority
  priority: 'priority', prio: 'priority', importance: 'priority',
  prioridade: 'priority',
  // Severity
  severity: 'severity', sev: 'severity', impact: 'severity',
  severidade: 'severity', criticidade: 'severity',
  // Tags
  tags: 'tags', labels: 'tags', label: 'tags', keywords: 'tags',
  // Assignee (informational, not imported)
  assignee: 'assignee', responsible: 'assignee', responsável: 'assignee', responsavel: 'assignee',
  // Status
  status: 'status', estado: 'status', state: 'status', situação: 'status',
}

/** Normalise a header for lookup: lowercase + collapse spaces/hyphens/underscores */
function normaliseHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s\-_\.\/]+/g, '_')
}

export function autoMapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  headers.forEach(h => {
    const key = normaliseHeader(h)
    const match = HEADER_ALIASES[key] ?? HEADER_ALIASES[h.toLowerCase().trim()]
    if (match) map[h] = match
  })
  return map
}

// Sheets whose names suggest they're metadata, not data
const SKIP_SHEET_PATTERNS = /^(legenda|legend|instrução|instrucao|readme|about|help|ajuda|future|evolução|evolucao)/i

// ── XLSX / CSV unified file parser (uses SheetJS for everything) ─────────────

export function parseFileContent(
  buffer: ArrayBuffer,
  filename: string
): ParseResult {
  let wb: XLSX.WorkBook

  try {
    wb = XLSX.read(buffer, { type: 'array' })
  } catch {
    return { rows: [], errors: [{ row: 0, message: 'Could not parse file. Try exporting as CSV.' }] }
  }

  // Merge rows from ALL data sheets (skip legend/readme sheets)
  const dataSheets = wb.SheetNames.filter(n => !SKIP_SHEET_PATTERNS.test(n))

  if (dataSheets.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'No data sheets found in workbook' }] }
  }

  const allRows: ParsedRow[] = []
  const allErrors: ParseError[] = []
  let globalRowOffset = 0

  for (const sheetName of dataSheets) {
    const ws = wb.Sheets[sheetName]
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (raw.length < 2) { globalRowOffset += raw.length; continue }

    const { rows, errors } = parseSheet(raw, sheetName, globalRowOffset)
    allRows.push(...rows)
    allErrors.push(...errors)
    globalRowOffset += raw.length
  }

  // Use headers from first sheet for display
  const firstSheet = wb.Sheets[dataSheets[0]]
  const firstRaw = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as unknown[][]
  const rawHeaders = firstRaw.length > 0 ? (firstRaw[0] as string[]).map(String).filter(Boolean) : []

  return { rows: allRows, errors: allErrors, rawHeaders }
}

function parseSheet(raw: unknown[][], sheetLabel: string, rowOffset: number): ParseResult {
  const headerRow = (raw[0] as string[]).map(String)
  const dataRows = raw.slice(1)

  const colMap = autoMapHeaders(headerRow)

  // Heuristic fallback when no title column was detected
  if (!Object.values(colMap).includes('title')) {
    const firstText = headerRow.find(h => !['#', 'id', 'num', 'nº', 'n', ''].includes(normaliseHeader(h)) && !colMap[h])
    if (firstText) colMap[firstText] = 'title'
    const secondText = headerRow.find(h => h !== firstText && !colMap[h] && !['#', 'id', 'num', 'nº', ''].includes(normaliseHeader(h)))
    if (secondText) colMap[secondText] = 'description'
  }

  const titleCol = headerRow.find(h => colMap[h] === 'title')
  const descCol  = headerRow.find(h => colMap[h] === 'description')
  const prioCol  = headerRow.find(h => colMap[h] === 'priority')
  const typeCol  = headerRow.find(h => colMap[h] === 'type')
  const tagsCol  = headerRow.find(h => colMap[h] === 'tags')

  const errors: ParseError[] = []
  const rows: ParsedRow[] = []

  dataRows.forEach((dataRow, idx) => {
    const rowNum = rowOffset + idx + 2
    const arr = dataRow as string[]

    const getCol = (col: string | undefined): string => {
      if (!col) return ''
      const ci = headerRow.indexOf(col)
      return ci >= 0 ? String(arr[ci] ?? '').trim() : ''
    }

    const titleRaw = getCol(titleCol)
    const descRaw  = getCol(descCol)

    if (!titleRaw) {
      errors.push({ row: rowNum, message: `${sheetLabel} row ${rowNum}: empty title, skipped` })
      return
    }

    const prioRaw = getCol(prioCol)
    const typeRaw = getCol(typeCol)
    const tagsRaw = getCol(tagsCol)

    const _raw: Record<string, string> = {}
    headerRow.filter(Boolean).forEach((h, i) => { _raw[h] = String(arr[i] ?? '') })

    rows.push({
      title:       titleRaw,
      description: descRaw,
      type:        typeRaw ? detectType(typeRaw) : detectTypeFromText(titleRaw + ' ' + descRaw),
      priority:    prioRaw ? detectPriority(prioRaw) : detectPriorityFromText(titleRaw + ' ' + descRaw),
      tags:        tagsRaw ? tagsRaw.split(/[;,|]/).map(t => t.trim()).filter(Boolean) : [],
      _raw,
    })
  })

  return { rows, errors }
}

// ── Email parser ──────────────────────────────────────────────────────────────

export function parseEmailText(raw: string): ParsedRow | null {
  const lines = raw.trim().split('\n').map(l => l.trim())

  let subject = ''
  let bodyStart = 0

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().startsWith('subject:')) {
      subject = lines[i].slice('subject:'.length).trim()
    }
    if (lines[i] === '' && i > 0) { bodyStart = i + 1; break }
  }

  if (!subject) {
    subject = lines.find(l => l.length > 0) ?? ''
    bodyStart = subject ? 1 : 0
  }

  const body = lines.slice(bodyStart)
    .filter(l => !l.startsWith('>') && l !== '--')
    .join('\n').trim()

  const combined = `${subject} ${body}`

  return {
    title:       subject || 'Imported from email',
    description: body,
    type:        detectTypeFromText(combined),
    priority:    detectPriorityFromText(combined),
    tags:        [],
  }
}
