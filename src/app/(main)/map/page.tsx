'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Map as MapIcon, Settings2, Layers, MapPin as MapPinIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Journal } from '@/types'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'

// Dynamically import map to avoid SSR issues with Leaflet
const JournalMap = dynamic(() => import('@/components/journal/journal-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
})

export type MapTheme = 'dark' | 'light' | 'street' | 'voyager'
export type PinStyle = 'photo' | 'circle' | 'dot' | 'standard'

export default function MapPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [journals, setJournals] = useState<Journal[]>([])
  
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark')
  const [pinStyle, setPinStyle] = useState<PinStyle>('photo')

  // Load preferences from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem('mapTheme') as MapTheme
    const savedPin = localStorage.getItem('pinStyle') as PinStyle
    if (savedTheme) setMapTheme(savedTheme)
    if (savedPin) setPinStyle(savedPin)
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('mapTheme', mapTheme)
    localStorage.setItem('pinStyle', pinStyle)
  }, [mapTheme, pinStyle])

  useEffect(() => {
    if (user) fetchJournals()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchJournals() {
    setIsLoading(true)
    const { data } = await supabase
      .from('journals')
      .select('*, journal_photos(photo_url)')
      .eq('user_id', user!.id)
      .not('location', 'is', null)

    setJournals((data as Journal[]) || [])
    setIsLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MapIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">World Map</h1>
            <p className="text-muted-foreground mt-1">Explore the places you've been and the memories you've made.</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary/20 bg-primary/5 hover:bg-primary/10 h-10 px-4 py-2 gap-2">
            <Settings2 className="w-4 h-4" />
            Customize Map
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-primary/20 shadow-xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Layers className="w-4 h-4" /> Map Theme
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={mapTheme} onValueChange={(v) => setMapTheme(v as MapTheme)}>
                <DropdownMenuRadioItem value="dark">Dark Matter (Premium)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">Positron (Light)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="voyager">Voyager (Colorful)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="street">Street Map (Classic)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-border/50" />
            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <MapPinIcon className="w-4 h-4" /> Pin Style
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={pinStyle} onValueChange={(v) => setPinStyle(v as PinStyle)}>
                <DropdownMenuRadioItem value="photo">Rounded Photos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="circle">Circular Photos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dot">Minimal Dots</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="standard">Standard Blue Pins</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 glass rounded-3xl border overflow-hidden relative z-0 shadow-sm">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <JournalMap journals={journals} theme={mapTheme} pinStyle={pinStyle} />
        )}
      </div>
    </div>
  )
}
