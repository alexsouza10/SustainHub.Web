import { useUIStore } from '@/stores/uiStore'
import { Bell, Moon, Sun, Search, Languages, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  title: string
  subtitle?: string
}

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
  { code: 'es', label: 'ES' },
] as const

export const Header = ({ title, subtitle }: HeaderProps) => {
  const { theme, setTheme, lang, setLang, toggleMobileMenu } = useUIStore()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-3">

        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 flex-shrink-0"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: search + controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search — hidden on small mobile */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('header.searchPlaceholder')}
              className="pl-10 bg-muted w-56"
            />
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>

          {/* Language selector */}
          <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
            <Languages className="h-3 w-3 text-muted-foreground ml-1 mr-0.5 hidden sm:block" />
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  'px-1.5 py-1 rounded text-[10px] font-semibold transition-colors',
                  lang === l.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
