import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Zap,
  LogOut,
  Menu,
  Settings,
  X,
  SquareKanban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { user, tenantName, logout } = useAuthStore()
  const { t } = useTranslation()

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'),     href: '/dashboard'      },
    { icon: ListTodo,        label: t('nav.tasks'),         href: '/tasks'          },
    { icon: SquareKanban,    label: 'Sprints',              href: '/sprints'        },
    { icon: Calendar,        label: t('nav.weeklyMeeting'), href: '/weekly-meeting' },
    { icon: Zap,             label: t('nav.aiInsights'),    href: '/ai-insights'    },
    { icon: Settings,        label: t('nav.admin'),         href: '/admin'          },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigate_ = (href: string) => {
    navigate(href)
    setMobileMenuOpen(false)
  }

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border min-h-[64px]">
        {(sidebarOpen || mobile) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
              S
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">SustainHub</div>
              <div className="text-[11px] text-muted-foreground">Maintenance OS</div>
            </div>
          </div>
        )}
        {mobile ? (
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8 flex-shrink-0 ml-auto">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 flex-shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!sidebarOpen && !mobile && (
          <div className="flex justify-center py-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
          </div>
        )}
        {navItems.map(item => {
          const Icon   = item.icon
          const active = location.pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => navigate_(item.href)}
              title={(!sidebarOpen && !mobile) ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                (!sidebarOpen && !mobile) && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        {(sidebarOpen || mobile) && (
          <div className="px-3 py-2 rounded-lg bg-muted/50 mb-1">
            <div className="text-xs font-semibold text-foreground truncate">{user?.name ?? '—'}</div>
            <div className="text-[11px] text-muted-foreground truncate">{tenantName ?? '—'}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={(!sidebarOpen && !mobile) ? t('nav.logout') : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground',
            'hover:bg-red-500/10 hover:text-red-400 transition-colors',
            (!sidebarOpen && !mobile) && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(sidebarOpen || mobile) && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-background border-r border-border transition-all duration-300',
          'hidden md:block',
          sidebarOpen ? 'w-64' : 'w-[68px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-background border-r border-border transition-transform duration-300 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent mobile />
      </aside>
    </>
  )
}
