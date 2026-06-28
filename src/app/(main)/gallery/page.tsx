'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Image as ImageIcon, Camera, LayoutGrid, LayoutTemplate } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
  created_at: string
  journals: { id: string; title: string | null; created_at: string }
}

export default function GalleryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [layout, setLayout] = useState<'collage' | 'grid'>('collage')

  useEffect(() => {
    if (user) fetchPhotos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchPhotos() {
    setIsLoading(true)
    // journal_photos has no user_id — join through journals to filter by owner
    const { data: myJournals } = await supabase
      .from('journals')
      .select('id')
      .eq('user_id', user!.id)

    if (!myJournals || myJournals.length === 0) {
      setPhotos([])
      setIsLoading(false)
      return
    }

    const journalIds = myJournals.map(j => j.id)
    const { data } = await supabase
      .from('journal_photos')
      .select('*, journals:journal_id(id, title, created_at)')
      .in('journal_id', journalIds)
      .order('created_at', { ascending: false })

    setPhotos((data as Photo[]) || [])
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="w-10 h-10 text-primary/50" />
        </div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Your Gallery</h1>
        <p className="text-muted-foreground max-w-sm">
          Photos you upload to your journal entries will appear here in a beautiful grid.
        </p>
        <Link href="/entry/new" className="text-sm text-primary hover:underline">
          Add your first photo →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Gallery</h1>
            <p className="text-muted-foreground text-sm">{photos.length} photo{photos.length !== 1 ? 's' : ''} across your journals</p>
          </div>
        </div>
        
        <div className="flex items-center bg-secondary/50 rounded-xl p-1 border">
          <button
            onClick={() => setLayout('collage')}
            className={`p-2 rounded-lg transition-colors ${layout === 'collage' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Collage View"
          >
            <LayoutTemplate className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={`p-2 rounded-lg transition-colors ${layout === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid or Collage layout */}
      <div className={layout === 'collage' 
        ? "columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2" 
        : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
      }>
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={`relative group cursor-pointer overflow-hidden rounded-xl bg-muted ${layout === 'collage' ? 'break-inside-avoid' : 'aspect-square'}`}
            onClick={() => setSelected(photo)}
          >
            <Image
              src={photo.photo_url}
              alt={photo.caption || `Photo ${i + 1}`}
              width={400}
              height={400}
              className={`w-full ${layout === 'collage' ? 'h-auto object-cover' : 'h-full object-cover'} group-hover:scale-105 transition-transform duration-500`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end p-2 opacity-0 group-hover:opacity-100">
              <p className="text-white text-xs font-medium line-clamp-1">
                {photo.journals?.title || format(new Date(photo.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={selected.photo_url}
              alt={selected.caption || 'Photo'}
              width={1200}
              height={900}
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {selected.caption && (
                <p className="text-white font-medium mb-1">{selected.caption}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">
                  {format(new Date(selected.created_at), 'MMMM d, yyyy')}
                </p>
                {selected.journals && (
                  <Link
                    href={`/entry/${selected.journals.id}`}
                    className="text-primary text-sm hover:underline"
                    onClick={() => setSelected(null)}
                  >
                    View entry →
                  </Link>
                )}
              </div>
            </div>
            <button
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
