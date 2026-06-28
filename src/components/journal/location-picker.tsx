'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface LocationData {
  name: string
  lat?: number
  lng?: number
}

interface LocationPickerProps {
  value: LocationData | null
  onChange: (loc: LocationData | null) => void
}

interface Suggestion {
  name: string
  city?: string
  state?: string
  country?: string
  lat: number
  lng: number
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [query, setQuery] = useState('')
  const [isEditingCustom, setIsEditingCustom] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced Search using Photon API
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 3) {
        setSuggestions([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        
        if (data && data.features) {
          const results = data.features.map((f: any) => ({
            name: f.properties.name,
            city: f.properties.city || f.properties.county,
            state: f.properties.state,
            country: f.properties.country,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }))
          // Filter out results without names
          setSuggestions(results.filter((r: Suggestion) => r.name))
          setShowDropdown(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 400)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Reverse geocode using OpenStreetMap Nominatim API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
          const data = await res.json()
          
          let placeName = 'Unknown Location'
          if (data && data.address) {
            placeName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || 'Current Location'
          }
          
          onChange({
            name: placeName,
            lat: latitude,
            lng: longitude
          })
        } catch (err) {
          console.error(err)
          // Fallback if geocoding fails
          onChange({
            name: 'Current Location',
            lat: latitude,
            lng: longitude
          })
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        toast.error('Could not get your location. Please check permissions.')
        console.error(error)
      }
    )
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const fullName = [suggestion.name, suggestion.city || suggestion.state, suggestion.country].filter(Boolean).join(', ')
    onChange({
      name: fullName,
      lat: suggestion.lat,
      lng: suggestion.lng
    })
    setIsEditingCustom(false)
    setQuery('')
    setShowDropdown(false)
  }

  const handleManualSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      onChange({ name: query.trim() }) // Manual fallback
      setIsEditingCustom(false)
      setQuery('')
      setShowDropdown(false)
      toast.success('Location saved (no map pin)')
    }
  }

  if (value) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
        </div>
        <div className="flex items-center gap-3 p-3 glass rounded-xl border">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{value.name}</p>
            {value.lat && value.lng ? (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">GPS Pinned</p>
            ) : (
              <p className="text-xs text-muted-foreground">Custom name only</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => onChange(null)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
      </div>
      
      {!isEditingCustom ? (
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 rounded-xl h-12 gap-2 bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            onClick={handleGetLocation}
            disabled={isLocating}
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {isLocating ? 'Locating...' : 'Add Current Location'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-xl h-12 px-4 text-muted-foreground"
            onClick={() => setIsEditingCustom(true)}
          >
            Search Map
          </Button>
        </div>
      ) : (
        <div className="relative flex gap-2" ref={dropdownRef}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {isSearching ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Search className="w-4 h-4 text-muted-foreground" />}
            </div>
            <Input 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowDropdown(true)
              }}
              onKeyDown={handleManualSubmit}
              onFocus={() => query.length > 0 && setShowDropdown(true)}
              placeholder="Search for a city or place..."
              className="rounded-xl h-12 bg-background border-muted pl-9"
              autoFocus
            />
            
            {/* Dropdown Menu */}
            {showDropdown && query.length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {suggestions.length > 0 ? (
                  <ul className="max-h-[250px] overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/50 flex items-start gap-3 transition-colors border-b border-border/50 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground truncate">{s.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {[s.city, s.state, s.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : !isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No verified places found.</p>
                    <p className="text-xs mt-1">Press Enter to save "{query}" as a custom name.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            className="rounded-xl h-12 px-4"
            onClick={() => {
              setIsEditingCustom(false)
              setQuery('')
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
