'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import Link from 'next/link'
import { MoreHorizontal, MessageCircle, MapPin, Globe, Lock, Users, Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import { sounds } from '@/lib/sounds'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MOODS } from '@/lib/constants'
import { ReactionBar } from '@/components/journal/reaction-bar'
import { CommentsSection } from '@/components/journal/comments-section'
import type { Journal, Profile } from '@/types'

interface JournalCardProps {
  entry: Journal & { journal_photos?: Array<{ photo_url: string }> }
  author: Profile
  isPreview?: boolean
}

export function JournalCard({ entry, author, isPreview = true }: JournalCardProps) {
  const mood = MOODS.find(m => m.id === entry.mood)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState<number>(entry.comments_count || 0)
  const [hasUnread, setHasUnread] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSavingLoading, setIsSavingLoading] = useState(false)
  const photos = entry.journal_photos?.map(p => p.photo_url) || []
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function fetchCardData() {
      // Fetch comment count
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('journal_id', entry.id)
      
      if (count !== null) setCommentCount(count)

      if (!user) return

      // Check unread comment notifications (only for journal owner)
      if (entry.user_id === user.id) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id')
          .eq('journal_id', entry.id)
          
        if (comments && comments.length > 0) {
          // Gracefully handle missing notifications table
          const { data: notifs, error: notifErr } = await supabase
            .from('notifications')
            .select('id')
            .eq('receiver_id', user.id)
            .eq('type', 'comment')
            .eq('is_read', false)
            .in('reference_id', comments.map(c => c.id))
            .limit(1)
            
          if (!notifErr && notifs && notifs.length > 0) {
            setHasUnread(true)
          }
        }
      }

      // Check saved status — gracefully handle missing saved_journals table
      const { data: saved, error: savedErr } = await supabase
        .from('saved_journals')
        .select('journal_id')
        .eq('user_id', user.id)
        .eq('journal_id', entry.id)
        .maybeSingle()
      
      if (!savedErr) {
        setIsSaved(!!saved)
      }
    }
    fetchCardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, entry.user_id, user])

  async function toggleSave() {
    if (!user) { toast.error('Please sign in to save'); return }
    if (isSavingLoading) return
    setIsSavingLoading(true)

    if (isSaved) {
      const { error } = await supabase
        .from('saved_journals')
        .delete()
        .eq('user_id', user.id)
        .eq('journal_id', entry.id)
      
      if (error) {
        toast.error('Could not remove from saved')
        console.error('Unsave error:', error)
      } else {
        setIsSaved(false)
        sounds.whoosh()
        toast.success('Removed from saved')
      }
    } else {
      const { error } = await supabase
        .from('saved_journals')
        .insert({ user_id: user.id, journal_id: entry.id })
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          toast.error('Please run the saved_journals SQL script in Supabase first')
        } else if (error.code === '23505') {
          // Already exists (duplicate) — just mark as saved
          setIsSaved(true)
        } else {
          toast.error('Could not save journal')
          console.error('Save error:', error)
        }
      } else {
        setIsSaved(true)
        sounds.success()
        toast.success('Saved! 🔖')
      }
    }
    setIsSavingLoading(false)
  }

  const VisibilityIcon = () => {
    switch (entry.visibility) {
      case 'private': return <Lock className="w-3 h-3 text-muted-foreground" />
      case 'friends': return <Users className="w-3 h-3 text-muted-foreground" />
      case 'public': return <Globe className="w-3 h-3 text-muted-foreground" />
      default: return null
    }
  }

  return (
    <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-xl transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 duration-300">
      {/* Header */}
      <CardHeader className="flex flex-row items-start gap-3 p-4 pb-3">
        <Link href={`/profile/${author?.username || ''}`}>
          <Avatar className="w-10 h-10 border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
            <AvatarImage src={author?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {author?.full_name?.charAt(0) || author?.username?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${author?.username || ''}`} className="font-semibold text-sm truncate hover:text-primary transition-colors">
              {author?.full_name || author?.username}
            </Link>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {mood && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary px-2 py-0.5 rounded-full">
                {mood.emoji} {mood.label}
              </span>
            )}
            <VisibilityIcon />
          </div>
        </div>
      </CardHeader>

      {/* Photos */}
      {photos.length > 0 && (
        <div className={`grid gap-0.5 ${photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {photos.slice(0, 4).map((photo, i) => (
            <div
              key={i}
              className={`relative bg-muted ${
                photos.length === 1 ? 'aspect-video' :
                photos.length === 3 && i === 0 ? 'row-span-2 aspect-square' :
                'aspect-square'
              } ${photos.length > 4 && i === 3 ? 'relative' : ''}`}
            >
              <Image
                src={photo}
                alt={`Journal photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              {photos.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{photos.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <CardContent className="p-4 pb-3">
        {entry.title && (
          <Link href={`/entry/${entry.id}`}>
            <h3 className="font-bold text-lg mb-1.5 font-[family-name:var(--font-heading)] hover:text-primary transition-colors cursor-pointer">
              {entry.title}
            </h3>
          </Link>
        )}
        <div 
          className={`text-foreground/90 leading-relaxed whitespace-pre-wrap ${
            isPreview ? 'line-clamp-4' : ''
          } prose prose-sm dark:prose-invert max-w-none`}
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
        {isPreview && entry.content.length > 300 && (
          <Link href={`/entry/${entry.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
            Read more
          </Link>
        )}

        {entry.location && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50 shadow-sm w-fit mt-1">
            <MapPin className="w-3.5 h-3.5" />
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
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entry.tags.map(tag => (
              <Link key={tag} href={`/feed?tag=${encodeURIComponent(tag)}`} className="text-xs text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      {/* Reactions */}
      <div className="px-4 pb-3">
        <ReactionBar journalId={entry.id} />
      </div>

      {/* Footer */}
      <CardFooter className="px-4 pt-2 pb-3 border-t border-border/50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 rounded-lg flex-1 relative ${showComments ? 'text-primary bg-primary/10' : ''}`}
          onClick={() => {
            setShowComments(!showComments)
            if (hasUnread) setHasUnread(false)
          }}
        >
          <div className="relative">
            <MessageCircle className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-background" />
            )}
          </div>
          <span className="text-xs">
            {showComments ? 'Hide' : commentCount > 0 ? `${commentCount} Comments` : 'Comment'}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSave}
          disabled={isSavingLoading}
          className={`gap-2 rounded-lg flex-1 transition-colors ${
            isSaved
              ? 'text-amber-500 bg-amber-500/10 hover:text-amber-600 hover:bg-amber-500/20'
              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
          }`}
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4" />
            : <Bookmark className="w-4 h-4" />}
          <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
        </Button>
      </CardFooter>

      {/* Comments */}
      <CommentsSection 
        journalId={entry.id} 
        isOpen={showComments} 
        onCommentAdded={() => setCommentCount(prev => prev + 1)} 
      />
    </Card>
  )
}
