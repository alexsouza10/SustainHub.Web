import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ListTodo, Calendar, Zap, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { t } = useTranslation()

  const items = [
    { icon: LayoutDashboard, label: t('nav.dashboard'),     href: '/dashboard'      },
    { icon: ListTodo,        label: t('nav.tasks'),         href: '/tasks'          },
    { icon: Calendar,        label: t('nav.weeklyMeeting'), href: '/weekly-meeting' },
    { icon: Zap,             label: t('nav.aiInsights'),    href: '/ai-insights'    },
    { icon: Settings,        label: t('nav.admin'),         href: '/admin'          },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map(item => {
          const Icon   = item.icon
          const active = location.pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[9px] font-medium truncate max-w-[52px] leading-tight">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
