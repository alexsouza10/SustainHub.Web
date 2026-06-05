import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface ExportMenuItem {
  label: string
  description?: string
  icon: React.ElementType
  onSelect: () => void
}

interface ExportMenuProps {
  label: string
  icon: React.ElementType
  items: ExportMenuItem[]
  variant?: 'default' | 'outline'
}

export function ExportMenu({ label, icon: TriggerIcon, items, variant = 'outline' }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click / Esc
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

  return (
    <div className="relative" ref={ref}>
      <Button variant={variant} size="sm" onClick={() => setOpen(o => !o)} className="gap-1.5">
        <TriggerIcon className="h-4 w-4" />
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-border bg-popover shadow-xl z-50 py-1 animate-in fade-in-0 zoom-in-95">
          {items.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => { item.onSelect(); setOpen(false) }}
                className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
