import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ListTodo, SquareKanban, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t } = useTranslation()

  const items = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: ListTodo,        label: t('nav.tasks'),     href: '/tasks'     },
    { icon: SquareKanban,    label: 'Sprints',          href: '/sprints'   },
    { icon: Settings,        label: t('nav.admin'),     href: '/admin'     },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/60 md:hidden shadow-lg">
      <div className="flex items-center justify-around px-1 py-1.5">
        {items.map(item => {
          const Icon   = item.icon
          const active = location.pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Icon with pill background when active */}
              <div className={cn(
                'p-1.5 rounded-xl transition-all duration-200',
                active ? 'bg-primary/12' : 'bg-transparent'
              )}>
                <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform duration-200', active && 'scale-110')} />
              </div>
              <span className={cn(
                'text-[9px] font-semibold truncate max-w-[48px] leading-tight transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
