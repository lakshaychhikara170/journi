'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Journal } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'

// Standard Leaflet Icon
const standardIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom marker generator
const createCustomIcon = (photoUrl?: string, pinStyle: string = 'photo') => {
  if (pinStyle === 'standard') {
    return standardIcon;
  }

  if (pinStyle === 'dot' || !photoUrl) {
    return L.divIcon({
      html: `
        <div style="
          width: 18px;
          height: 18px;
          background-color: hsl(262, 83%, 65%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3), 0 4px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9]
    })
  }

  if (pinStyle === 'circle') {
    return L.divIcon({
      html: `
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          background-color: white;
          background-image: url('${photoUrl}');
          background-size: cover;
          background-position: center;
          transform: translate(-50%, -50%);
        "></div>
      `,
      className: '',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    })
  }
  
  // Default 'photo' style
  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        background-color: white;
        position: relative;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background-image: url('${photoUrl}');
          background-size: cover;
          background-position: center;
        "></div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid white;
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
        "></div>
      </div>
    `,
    className: '',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -54]
  })
}

interface JournalMapProps {
  journals: any[] // Using any to avoid type errors with joined journal_photos
  theme?: 'dark' | 'light' | 'street' | 'voyager'
  pinStyle?: 'photo' | 'circle' | 'dot' | 'standard'
}

export default function JournalMap({ journals, theme = 'dark', pinStyle = 'photo' }: JournalMapProps) {
  // Supabase returns stringified JSON if the column is text instead of jsonb
  const parsedJournals = journals.map(j => {
    if (typeof j.location === 'string') {
      try {
        return { ...j, location: JSON.parse(j.location) }
      } catch (e) {
        return j
      }
    }
    return j
  })

  const mapJournals = parsedJournals.filter(j => j.location && typeof j.location === 'object' && j.location.lat && j.location.lng)
  
  if (mapJournals.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-background">
        <p>No locations logged yet.</p>
        <p className="text-sm mt-2">When you add a location to your journal entries, they will appear here on the map.</p>
      </div>
    )
  }

  // Calculate bounds or use a default center (e.g. center of the first journal)
  const defaultCenter: [number, number] = [
    mapJournals[0].location!.lat!,
    mapJournals[0].location!.lng!
  ]

  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  const attributions = {
    dark: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    light: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    voyager: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    street: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }

  const bgColors: Record<string, string> = {
    dark: '#111',
    light: '#f8f9fa',
    voyager: '#f1f0ea',
    street: '#f8f9fa'
  }

  const isDark = theme === 'dark'

  return (
    <div className="w-full h-full isolate" style={{ backgroundColor: bgColors[theme] }}>
      <MapContainer 
        key={theme}
        center={defaultCenter} 
        zoom={3} 
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', borderRadius: 'inherit', background: bgColors[theme] }}
      >
        <TileLayer
          attribution={attributions[theme]}
          url={tileUrls[theme]}
          noWrap={true}
          bounds={[[-90, -180], [90, 180]]}
        />
        
        {mapJournals.map(journal => {
          const photoUrl = journal.journal_photos?.[0]?.photo_url
          return (
            <Marker 
              key={journal.id} 
              position={[journal.location!.lat!, journal.location!.lng!]} 
              icon={createCustomIcon(photoUrl, pinStyle)}
            >
              <Popup className={`rounded-xl overflow-hidden ${isDark ? 'custom-dark-popup' : 'custom-light-popup'}`}>
                <div className="p-1 min-w-[200px]">
                  <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-foreground' : 'text-slate-900'}`}>{journal.title}</h3>
                  <p className={`text-xs mb-2 ${isDark ? 'text-muted-foreground' : 'text-slate-500'}`}>
                    {format(new Date(journal.created_at), 'MMM d, yyyy')} • {journal.location!.name}
                  </p>
                  {photoUrl && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative">
                      <img src={photoUrl} alt="Thumbnail" className="object-cover w-full h-full" />
                    </div>
                  )}
                  {journal.content && !photoUrl && (
                    <p className={`text-sm line-clamp-3 mb-3 ${isDark ? 'text-foreground/80' : 'text-slate-700'}`}>
                      {journal.content.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                  <Link href={`/entry/${journal.id}`} className="text-sm text-primary hover:underline font-medium block text-right mt-2">
                    View Entry →
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-dark-popup .leaflet-popup-content-wrapper {
          background: hsl(222 47% 14%);
          color: hsl(210 40% 98%);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .custom-dark-popup .leaflet-popup-tip {
          background: hsl(222 47% 14%);
        }
        .custom-dark-popup.leaflet-container a.leaflet-popup-close-button {
          color: hsl(215 20% 65%);
          padding: 8px;
        }

        .custom-light-popup .leaflet-popup-content-wrapper {
          background: white;
          color: hsl(222 47% 14%);
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .custom-light-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-light-popup.leaflet-container a.leaflet-popup-close-button {
          color: hsl(215 20% 65%);
          padding: 8px;
        }

        /* Fix Leaflet Zoom Controls with Tailwind */
        .leaflet-control-zoom.leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background-color: hsl(222 47% 14%) !important;
          color: hsl(210 40% 98%) !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: hsl(222 47% 20%) !important;
        }
        .leaflet-control-zoom a.leaflet-disabled {
          background-color: hsl(222 47% 10%) !important;
          color: rgba(255,255,255,0.3) !important;
        }
      `}} />
    </div>
  )
}
