'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { sounds } from '@/lib/sounds'

const REACTION_EMOJIS = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'amazing', emoji: '💯', label: 'Amazing' },
]

interface ReactionBarProps {
  journalId: string
}

interface ReactionCount {
  reaction_type: string
  count: number
  reacted: boolean
}

export function ReactionBar({ journalId }: ReactionBarProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [reactions, setReactions] = useState<ReactionCount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchReactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId])

  async function fetchReactions() {
    const { data } = await supabase
      .from('reactions')
      .select('reaction_type, user_id')
      .eq('journal_id', journalId)

    if (!data) return

    const counts: Record<string, { count: number; reacted: boolean }> = {}
    for (const r of data) {
      if (!counts[r.reaction_type]) counts[r.reaction_type] = { count: 0, reacted: false }
      counts[r.reaction_type].count++
      if (r.user_id === user?.id) counts[r.reaction_type].reacted = true
    }

    setReactions(
      REACTION_EMOJIS.map((re) => ({
        reaction_type: re.type,
        count: counts[re.type]?.count || 0,
        reacted: counts[re.type]?.reacted || false,
      }))
    )
  }

  async function toggleReaction(reactionType: string) {
    if (!user) { toast.error('Please sign in to react'); return }
    if (isLoading) return
    setIsLoading(true)

    const existing = reactions.find(r => r.reaction_type === reactionType)

    if (existing?.reacted) {
      await supabase.from('reactions').delete()
        .eq('journal_id', journalId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
      sounds.whoosh()
    } else {
      await supabase.from('reactions').insert({
        journal_id: journalId,
        user_id: user.id,
        reaction_type: reactionType,
      })
      sounds.pop()
      const { data: journal } = await supabase.from('journals').select('user_id').eq('id', journalId).single()
      if (journal && journal.user_id !== user.id) {
        const reactionEmoji = REACTION_EMOJIS.find(r => r.type === reactionType)
        await supabase.from('notifications').insert({
          receiver_id: journal.user_id,
          sender_id: user.id,
          type: 'reaction' as any,
          reference_id: journalId,
          reference_table: 'journals',
          message: `Someone reacted ${reactionEmoji?.emoji || ''} to your journal`
        })
      }
    }

    await fetchReactions()
    setIsLoading(false)
  }

  const activeReactions = reactions.filter(r => r.count > 0)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_EMOJIS.map((re) => {
        const data = reactions.find(r => r.reaction_type === re.type)
        const isActive = data?.reacted || false
        const count = data?.count || 0

        return (
          <button
            key={re.type}
            onClick={() => toggleReaction(re.type)}
            title={re.label}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium
              transition-all duration-200 border
              ${isActive
                ? 'bg-primary/15 border-primary/30 text-primary scale-105'
                : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105'
              }
            `}
          >
            <span className="text-base leading-none">{re.emoji}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
