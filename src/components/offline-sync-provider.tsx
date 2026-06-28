'use client'

import { useEffect } from 'react'
import { syncOfflineJournals } from '@/lib/offline-sync'
import { toast } from 'sonner'

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Attempt sync on initial load if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncOfflineJournals().catch(console.error)
    }

    const handleOnline = () => {
      toast.success('Back online! Syncing offline journals...', { icon: '📡' })
      syncOfflineJournals().then(() => {
        // Optional: you could refresh the router here if you want new journals to appear instantly,
        // but showing a toast is usually enough.
      }).catch(console.error)
    }

    const handleOffline = () => {
      toast('You are offline. Journals will be saved to your device.', { icon: '✈️' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return <>{children}</>
}
