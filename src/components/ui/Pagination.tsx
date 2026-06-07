import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from './button'

const DEFAULT_PAGE_SIZES = [10, 30, 50, 100, 200]

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  itemLabel = 'items',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {totalItems} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Per page</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background pl-2 pr-6 text-xs appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pageSizeOptions.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1}
            onClick={() => onPageChange(page - 1)} title="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[72px] text-center">
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)} title="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
