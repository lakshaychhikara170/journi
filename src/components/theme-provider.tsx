'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ThemeType } from '@/types'

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark')
  const [mounted, setMounted] = useState(false)

  const applyTheme = (t: ThemeType) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'amoled')
    root.classList.add(t)
  }

  useEffect(() => {
    const stored = localStorage.getItem('journi-theme') as ThemeType | null
    if (stored) {
      setThemeState(stored)
      applyTheme(stored)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const defaultTheme = prefersDark ? 'dark' : 'light'
      setThemeState(defaultTheme)
      applyTheme(defaultTheme)
    }
    setMounted(true)
  }, [])

  const setTheme = (t: ThemeType) => {
    setThemeState(t)
    localStorage.setItem('journi-theme', t)
    applyTheme(t)
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
