import { create } from 'zustand'
import i18n from '@/lib/i18n'

type Theme = 'dark' | 'light'
type Lang  = 'en' | 'pt' | 'es'

interface UIState {
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  theme: Theme
  lang: Lang
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

const savedTheme = (localStorage.getItem('theme') as Theme) ?? 'dark'
applyTheme(savedTheme)

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  theme: savedTheme,
  lang: (localStorage.getItem('lang') as Lang) ?? 'en',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  setLang: (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
    set({ lang })
  },
}))
