import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button and handle Escape / Enter
  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95"
      >
        {/* Icon + header */}
        <div className="flex gap-4 px-6 pt-6 pb-4">
          <div className={cn(
            'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full',
            variant === 'danger' ? 'bg-red-500/15' : 'bg-yellow-500/15'
          )}>
            <AlertTriangle className={cn(
              'h-5 w-5',
              variant === 'danger' ? 'text-red-400' : 'text-yellow-400'
            )} />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 pb-5 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white focus-visible:ring-yellow-500'
            )}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
