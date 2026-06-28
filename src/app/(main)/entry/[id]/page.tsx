'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowLeft, Globe, Lock, Users, MapPin, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MOODS } from '@/lib/constants'
import { ReactionBar } from '@/components/journal/reaction-bar'
import { CommentsSection } from '@/components/journal/comments-section'
import type { Journal, Profile } from '@/types'

type JournalWithAuthor = Journal & {
  profiles: Profile
  journal_photos?: Array<{ id: string; photo_url: string }>
}

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [entry, setEntry] = useState<JournalWithAuthor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchEntry()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchEntry() {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('journals')
      .select('*, profiles:user_id (*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    // Fetch photos separately
    const { data: photos } = await supabase
      .from('journal_photos')
      .select('id, photo_url')
      .eq('journal_id', id)

    setEntry({ ...data, journal_photos: photos || [] })
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold">Entry not found</h1>
        <p className="text-muted-foreground">This journal entry doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </Button>
      </div>
    )
  }

  const mood = MOODS.find(m => m.id === entry.mood)
  const author = entry.profiles
  const photos = entry.journal_photos || []

  const VisibilityIcon = () => {
    switch (entry.visibility) {
      case 'private': return <Lock className="w-4 h-4" />
      case 'friends': return <Users className="w-4 h-4" />
      case 'public': return <Globe className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Author header */}
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-border">
          <AvatarImage src={author?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
            {author?.full_name?.charAt(0) || author?.username?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{author?.full_name || author?.username}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{format(new Date(entry.created_at), 'MMMM d, yyyy • h:mm a')}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><VisibilityIcon />{entry.visibility}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      {entry.title && (
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] leading-tight">
          {entry.title}
        </h1>
      )}

      {/* Mood */}
      {mood && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm font-medium">
          <span className="text-lg">{mood.emoji}</span>
          <span>{mood.label}</span>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className={`grid gap-2 rounded-2xl overflow-hidden ${
          photos.length === 1 ? 'grid-cols-1' :
          photos.length === 2 ? 'grid-cols-2' :
          photos.length === 3 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative bg-muted cursor-pointer overflow-hidden ${
                photos.length === 1 ? 'aspect-video' :
                photos.length === 3 && i === 0 ? 'row-span-2 aspect-square' :
                'aspect-square'
              }`}
              onClick={() => setSelectedPhoto(photo.photo_url)}
            >
              <Image
                src={photo.photo_url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div 
        className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      {/* Location */}
      {entry.location && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            {(() => {
              if (typeof entry.location === 'string') {
                try { return JSON.parse(entry.location).name }
                catch { return entry.location }
              }
              return (entry.location as any)?.name
            })()}
          </span>
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map(tag => (
            <span key={tag} className="text-sm text-primary/70 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div className="border-t border-border/50 pt-4">
        <ReactionBar journalId={entry.id} />
      </div>

      {/* Comments toggle */}
      <div className="border-t border-border/50">
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-left flex items-center gap-2"
        >
          💬 {showComments ? 'Hide comments' : 'Show comments'}
        </button>
        <CommentsSection journalId={entry.id} isOpen={showComments} />
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <Image
              src={selectedPhoto}
              alt="Photo"
              width={1200}
              height={900}
              className="w-full h-full object-contain max-h-[90vh] rounded-2xl"
            />
            <button
              className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors text-lg"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
