'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'
import { StreakCelebration } from '@/components/streak-celebration'
import { BadgeUnlockModal } from '@/components/gamification/badge-unlock-modal'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const STREAK_MILESTONES = [3, 7, 14, 30, 100]
const CELEBRATED_KEY = 'journi_celebrated_streaks'

function getCelebratedStreaks(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CELEBRATED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function markStreakCelebrated(streak: number) {
  const celebrated = getCelebratedStreaks()
  if (!celebrated.includes(streak)) {
    celebrated.push(streak)
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify(celebrated))
  }
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, streak, isLoading } = useAuth()
  const profile = useAuthStore(state => state.profile)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationStreak, setCelebrationStreak] = useState(0)

  useEffect(() => {
    if (!streak || streak.current_streak === 0) return
    const current = streak.current_streak
    if (STREAK_MILESTONES.includes(current) && !getCelebratedStreaks().includes(current)) {
      setCelebrationStreak(current)
      setShowCelebration(true)
      markStreakCelebrated(current)
    }
  }, [streak])

  useEffect(() => {
    const handleTest = (e: any) => {
      setCelebrationStreak(e.detail.streak || 7)
      setShowCelebration(true)
    }
    window.addEventListener('test-celebration', handleTest)
    return () => window.removeEventListener('test-celebration', handleTest)
  }, [])

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your journal...</p>
        </div>
      </div>
    )
  }

  // We don't need to redirect here because middleware.ts handles it!
  // It's much faster to handle auth redirects at the edge/middleware.
  if (!user) return null
  
  if (profile?.is_banned) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-3xl mb-2">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended for violating our terms of service. 
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        <Header />
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Streak Celebration Overlay */}
      <StreakCelebration
        streak={celebrationStreak}
        show={showCelebration}
        onClose={handleCloseCelebration}
      />
      
      {/* Badge Unlock Modal */}
      <BadgeUnlockModal />
    </div>
  )
}
