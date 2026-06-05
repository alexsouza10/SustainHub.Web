import {
  TicketDto, TicketStatus,
  PRIORITY_LABEL, SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL,
} from '@/types'
import { statusGroupOf, STATUS_GROUP_LABEL } from '@/lib/taskStatus'

// ── shared helpers ──────────────────────────────────────────────────────────

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '')
const fmtDateTime = () => new Date().toLocaleString('pt-BR')

function resolutionDays(t: TicketDto): string {
  if (!t.closedAt) return ''
  const start = new Date(t.createdAt).getTime()
  const end = new Date(t.closedAt).getTime()
  const days = (end - start) / (1000 * 60 * 60 * 24)
  return days.toFixed(1)
}

// Columns shared by CSV + Excel
const COLUMNS: { header: string; value: (t: TicketDto) => string }[] = [
  { header: 'ID',            value: t => t.id.slice(0, 8) },
  { header: 'Title',         value: t => t.title },
  { header: 'Type',          value: t => TYPE_LABEL[t.type] ?? String(t.type) },
  { header: 'Priority',      value: t => PRIORITY_LABEL[t.priority] ?? String(t.priority) },
  { header: 'Severity',      value: t => SEVERITY_LABEL[t.severity] ?? String(t.severity) },
  { header: 'Status',        value: t => STATUS_LABEL[t.status] ?? String(t.status) },
  { header: 'Group',         value: t => STATUS_GROUP_LABEL[statusGroupOf(t.status)] },
  { header: 'Assignee',      value: t => t.assignedToUserName ?? '' },
  { header: 'Created By',    value: t => t.createdByUserName ?? '' },
  { header: 'Project',       value: t => t.projectName ?? '' },
  { header: 'Tags',          value: t => (t.tags ?? []).join('; ') },
  { header: 'Est. Hours',    value: t => t.estimatedHours?.toString() ?? '' },
  { header: 'Created At',    value: t => fmt(t.createdAt) },
  { header: 'Started At',    value: t => fmt(t.startedAt) },
  { header: 'Closed At',     value: t => fmt(t.closedAt) },
  { header: 'Resolution (d)',value: t => resolutionDays(t) },
  { header: 'Justification', value: t => t.justification ?? '' },
]

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function timestamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── CSV ─────────────────────────────────────────────────────────────────────

export function exportTasksCSV(tasks: TicketDto[]) {
  const esc = (v: string) => {
    if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }
  const header = COLUMNS.map(c => esc(c.header)).join(',')
  const rows = tasks.map(t => COLUMNS.map(c => esc(c.value(t))).join(','))
  // UTF-8 BOM so Excel reads accents correctly
  const csv = '﻿' + [header, ...rows].join('\r\n')
  downloadBlob(csv, `tasks_${timestamp()}.csv`, 'text/csv;charset=utf-8')
}

// ── Excel (SpreadsheetML 2003 .xls — opens natively, no format warning) ───────

export function exportTasksExcel(tasks: TicketDto[]) {
  const xmlEsc = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const headerCells = COLUMNS.map(
    c => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(c.header)}</Data></Cell>`
  ).join('')

  const bodyRows = tasks.map(t => {
    const cells = COLUMNS.map(c => {
      const raw = c.value(t)
      const isNum = c.header === 'Est. Hours' || c.header === 'Resolution (d)'
      if (isNum && raw !== '') {
        return `<Cell><Data ss:Type="Number">${raw}</Data></Cell>`
      }
      return `<Cell><Data ss:Type="String">${xmlEsc(raw)}</Data></Cell>`
    }).join('')
    return `<Row>${cells}</Row>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Tasks">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`

  downloadBlob(xml, `tasks_${timestamp()}.xls`, 'application/vnd.ms-excel;charset=utf-8')
}

// ── KPI computation (Monthly-Report style, computed from the task list) ───────

export interface ReportKpis {
  total: number
  open: number
  inProgress: number
  blocked: number
  done: number
  cancelled: number
  openBugs: number
  closedThisMonth: number
  avgResolutionDays: string
}

export function computeKpis(tasks: TicketDto[]): ReportKpis {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const groupCount = (g: ReturnType<typeof statusGroupOf>) =>
    tasks.filter(t => statusGroupOf(t.status) === g).length

  const resolved = tasks.filter(t => t.closedAt)
  const avg = resolved.length
    ? (resolved.reduce((acc, t) => {
        const d = (new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime()) / 86_400_000
        return acc + d
      }, 0) / resolved.length).toFixed(1)
    : '—'

  return {
    total: tasks.length,
    open: groupCount('open'),
    inProgress: groupCount('in-progress'),
    blocked: groupCount('blocked'),
    done: groupCount('done'),
    cancelled: groupCount('cancelled'),
    openBugs: tasks.filter(t => t.type === 1 && t.status !== TicketStatus.Done && t.status !== TicketStatus.Cancelled).length,
    closedThisMonth: tasks.filter(t => t.closedAt && new Date(t.closedAt).getTime() >= monthStart).length,
    avgResolutionDays: avg,
  }
}

// ── PDF report (styled print window — produces a true PDF via "Save as PDF") ──

export interface ReportMeta {
  tenantName: string
  generatedBy: string
  dateFilterLabel?: string  // e.g. "Created: 01/06 – 30/06"
  scopeLabel?: string       // e.g. "Status: Open · Type: Bug"
}

export function exportTasksPDF(tasks: TicketDto[], meta: ReportMeta) {
  const kpis = computeKpis(tasks)
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const kpiCards = [
    { label: 'Total Tasks',     value: kpis.total,            color: '#64748b' },
    { label: 'Open',            value: kpis.open,             color: '#3b82f6' },
    { label: 'In Progress',     value: kpis.inProgress,       color: '#06b6d4' },
    { label: 'Blocked',         value: kpis.blocked,          color: '#ef4444' },
    { label: 'Done',            value: kpis.done,             color: '#22c55e' },
    { label: 'Cancelled',       value: kpis.cancelled,        color: '#9ca3af' },
    { label: 'Open Bugs',       value: kpis.openBugs,         color: '#f97316' },
    { label: 'Avg Resolution',  value: `${kpis.avgResolutionDays}d`, color: '#8b5cf6' },
  ].map(c => `
    <div class="kpi">
      <div class="kpi-val" style="color:${c.color}">${c.value}</div>
      <div class="kpi-lbl">${c.label}</div>
    </div>`).join('')

  const esc = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const rows = tasks.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(t.title)}</td>
      <td>${TYPE_LABEL[t.type] ?? t.type}</td>
      <td>${PRIORITY_LABEL[t.priority] ?? t.priority}</td>
      <td>${STATUS_LABEL[t.status] ?? t.status}</td>
      <td>${esc(t.assignedToUserName ?? '—')}</td>
      <td>${fmt(t.createdAt)}</td>
      <td>${fmt(t.closedAt) || '—'}</td>
    </tr>`).join('')

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Tasks Report — ${esc(meta.tenantName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #2563eb; padding-bottom:16px; margin-bottom:24px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .logo { width:40px; height:40px; border-radius:10px; background:#2563eb; color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:20px; }
  h1 { font-size:20px; margin:0; }
  .sub { color:#64748b; font-size:12px; margin-top:2px; }
  .meta { text-align:right; font-size:11px; color:#64748b; line-height:1.6; }
  .kpis { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:24px; }
  .kpi { border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; }
  .kpi-val { font-size:26px; font-weight:800; line-height:1; }
  .kpi-lbl { font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:#64748b; margin-top:6px; font-weight:600; }
  .section-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#334155; margin:24px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { background:#f1f5f9; text-align:left; padding:8px 10px; font-size:10px; text-transform:uppercase; letter-spacing:.04em; color:#475569; border-bottom:2px solid #e2e8f0; }
  td { padding:7px 10px; border-bottom:1px solid #f1f5f9; }
  tr:nth-child(even) td { background:#fafbfc; }
  .foot { margin-top:28px; font-size:10px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:12px; }
  @media print { body { padding:0; } .no-print { display:none; } @page { margin:16mm; } }
  .print-btn { position:fixed; top:16px; right:16px; background:#2563eb; color:#fff; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF / Print</button>

  <div class="head">
    <div class="brand">
      <div class="logo">S</div>
      <div>
        <h1>Tasks Report</h1>
        <div class="sub">${esc(meta.tenantName)} · ${monthLabel}</div>
      </div>
    </div>
    <div class="meta">
      Generated: ${fmtDateTime()}<br>
      By: ${esc(meta.generatedBy)}<br>
      ${meta.dateFilterLabel ? esc(meta.dateFilterLabel) + '<br>' : ''}
      ${meta.scopeLabel ? esc(meta.scopeLabel) : ''}
    </div>
  </div>

  <div class="kpis">${kpiCards}</div>

  <div class="section-title">Task Detail (${tasks.length})</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Title</th><th>Type</th><th>Priority</th>
        <th>Status</th><th>Assignee</th><th>Created</th><th>Closed</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:24px">No tasks in selection</td></tr>'}</tbody>
  </table>

  <div class="foot">SustainHub · Software Operations Intelligence — confidential</div>

  <script>
    // Auto-open the print dialog once rendered
    window.onload = () => setTimeout(() => window.print(), 350);
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups to generate the PDF report.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
