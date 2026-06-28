'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow } from 'date-fns'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Comment, Profile } from '@/types'

interface CommentsProps {
  journalId: string
  isOpen: boolean
  onCommentAdded?: () => void
}

type CommentWithProfile = Comment & { profiles: Profile }

export function CommentsSection({ journalId, isOpen, onCommentAdded }: CommentsProps) {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) fetchComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, journalId])

  async function fetchComments() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('journal_id', journalId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      setComments([])
      setIsLoading(false)
      return
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, Profile>)

      const enriched = data.map(c => ({
        ...c,
        profiles: profilesMap[c.user_id]
      }))
      setComments(enriched as CommentWithProfile[])
    } else {
      setComments([])
    }

    setIsLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newComment.trim()) return
    setIsSending(true)

    const { data: insertedComment, error } = await supabase.from('comments').insert({
      journal_id: journalId,
      user_id: user.id,
      content: newComment.trim(),
    }).select().single()

    if (error) {
      console.error('Comment insert error:', error)
      toast.error('Failed to post comment')
    } else {
      // Fetch journal owner to send notification
      const { data: journal } = await supabase.from('journals').select('user_id').eq('id', journalId).single()
      if (journal) {
        const { error: notifError } = await supabase.from('notifications').insert({
          receiver_id: journal.user_id,
          sender_id: user.id,
          type: 'comment',
          reference_id: insertedComment.id,
          reference_table: 'comments',
          message: `${profile?.full_name || profile?.username || 'Someone'} commented on your journal`
        })
        if (notifError) console.error("Notification insert error:", notifError)
      }

      setNewComment('')
      onCommentAdded?.()
      await fetchComments()
    }
    setIsSending(false)
  }

  if (!isOpen) return null

  return (
    <div className="border-t border-border/50 bg-muted/20">
      {/* Comments list */}
      <div className="max-h-72 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                <AvatarImage src={comment.profiles?.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-background rounded-2xl px-3 py-2">
                  <p className="text-xs font-semibold text-foreground/80">
                    {comment.profiles?.full_name || comment.profiles?.username}
                  </p>
                  <p className="text-sm mt-0.5 break-words">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-3">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Comment input */}
      <form onSubmit={postComment} className="flex gap-2 p-3 pt-0">
        <Avatar className="w-7 h-7 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 bg-background rounded-full px-4 py-1.5 border border-border/50">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="text-primary hover:text-primary/80 disabled:opacity-40 transition-opacity"
          >
            {isSending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </form>
    </div>
  )
}
