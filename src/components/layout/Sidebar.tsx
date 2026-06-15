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
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { user, tenantName, logout } = useAuthStore()
  const { t } = useTranslation()

  const canAccessAdmin = user?.role === UserRole.SuperAdmin
    || user?.role === UserRole.TenantAdmin
    || user?.role === UserRole.Manager

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: ListTodo,        label: t('nav.tasks'),     href: '/tasks'     },
    { icon: SquareKanban,    label: 'Sprints',          href: '/sprints'   },
    ...(canAccessAdmin ? [{ icon: Settings, label: t('nav.admin'), href: '/admin' }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigate_ = (href: string) => {
    navigate(href)
    setMobileMenuOpen(false)
  }

  /* Iniciais do usuário para o avatar */
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/60 min-h-[64px]">
        {(sidebarOpen || mobile) && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              S
            </div>
            <div>
              <div className="text-sm font-bold leading-tight tracking-tight">SustainHub</div>
              <div className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Maintenance OS</div>
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
          <div className="flex justify-center py-1 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
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
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/15'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                (!sidebarOpen && !mobile) && 'justify-center px-2'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-primary')} />
              {(sidebarOpen || mobile) && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border/60 space-y-1">
        {(sidebarOpen || mobile) && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/40 mb-1">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate leading-tight">{user?.name ?? '—'}</div>
              <div className="text-[10px] text-muted-foreground truncate">{tenantName ?? '—'}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={(!sidebarOpen && !mobile) ? t('nav.logout') : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground',
            'hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200',
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
          'fixed left-0 top-0 z-40 h-screen bg-background border-r border-border/60 transition-all duration-300',
          'hidden md:block',
          sidebarOpen ? 'w-64' : 'w-[68px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 bg-background border-r border-border/60 transition-transform duration-300 md:hidden shadow-2xl',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent mobile />
      </aside>
    </>
  )
}
