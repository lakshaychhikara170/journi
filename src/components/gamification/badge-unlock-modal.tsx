'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export interface BadgeUnlockData {
  id: string
  name: string
  description: string
  icon: string
}

export function BadgeUnlockModal() {
  const { badgeQueue, popBadge } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentBadge = badgeQueue[0]

  useEffect(() => {
    if (currentBadge) {
      try {
        confetti({ 
          particleCount: 150, 
          spread: 100, 
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#eab308', '#3b82f6'],
          zIndex: 9999
        })
      } catch (e) {
        console.error("Confetti error", e)
      }
    }
  }, [currentBadge])

  if (!mounted || !currentBadge) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={popBadge} />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-card/90 backdrop-blur-xl p-8 text-center shadow-2xl z-10"
      >
        {/* Glowing background blob */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2, damping: 15 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 shadow-inner ring-1 ring-primary/20 text-6xl drop-shadow-2xl"
        >
          {currentBadge.icon}
        </motion.div>

        <h2 className="mb-2 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">
          {currentBadge.name}!
        </h2>
        
        <p className="mb-8 text-muted-foreground text-sm leading-relaxed">
          {currentBadge.description}
        </p>

        <Button 
          size="lg" 
          className="w-full rounded-2xl font-bold text-base h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          onClick={popBadge}
        >
          Keep Going! 🚀
        </Button>
      </motion.div>
    </div>
  )
}
