'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, MonitorSmartphone } from 'lucide-react'
import { toast } from 'sonner'

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      toast('Install Journi on iOS', {
        description: 'Tap the Share icon at the bottom of Safari, then select "Add to Home Screen".',
        icon: <MonitorSmartphone className="h-4 w-4" />,
        duration: 8000,
      })
      return
    }

    if (!deferredPrompt) {
      toast('Installation not ready', {
        description: 'The app is not ready to be installed yet, or it is already installed.',
      })
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
  }

  // Only render if it's installable or if it's iOS (since iOS users need manual instructions)
  if (!isInstallable && !isIOS) {
    return null
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={handleInstallClick}
      className="w-full flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}
