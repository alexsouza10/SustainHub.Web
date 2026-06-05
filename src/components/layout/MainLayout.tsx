import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        'transition-all duration-300',
        sidebarOpen ? 'md:ml-64' : 'md:ml-[68px]'
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
