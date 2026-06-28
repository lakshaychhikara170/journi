'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { subMonths, subYears, startOfDay, endOfDay, format, isSameDay } from 'date-fns'
import { Loader2, Sparkles, Calendar, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { MOODS } from '@/lib/constants'
import type { Journal } from '@/types'

interface Memory {
  label: string
  icon: string
  journals: Journal[]
}

export default function MemoriesPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    if (user) fetchMemories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchMemories() {
    setIsLoading(true)
    const checkpoints = [
      { label: '1 Month Ago', icon: '📅', date: subMonths(today, 1) },
      { label: '3 Months Ago', icon: '🌸', date: subMonths(today, 3) },
      { label: '6 Months Ago', icon: '🍂', date: subMonths(today, 6) },
      { label: '1 Year Ago', icon: '🎉', date: subYears(today, 1) },
      { label: '2 Years Ago', icon: '✨', date: subYears(today, 2) },
    ]

    const loaded: Memory[] = []

    for (const cp of checkpoints) {
      const { data } = await supabase
        .from('journals')
        .select('*, journal_photos(*)')
        .eq('user_id', user!.id)
        .gte('created_at', startOfDay(cp.date).toISOString())
        .lte('created_at', endOfDay(cp.date).toISOString())
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        loaded.push({ label: cp.label, icon: cp.icon, journals: data as Journal[] })
      }
    }

    setMemories(loaded)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm animate-pulse">Traveling back in time…</p>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="text-6xl">✨</div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">No Memories Yet</h1>
        <p className="text-muted-foreground max-w-sm">
          Keep journaling! Your past entries from 1 month, 6 months, and 1 year ago will magically appear here.
        </p>
        <Link href="/entry/new" className="text-sm text-primary hover:underline">
          Write today's entry →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-fade-in pb-12">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Your Memories</h1>
        </div>
        <p className="text-muted-foreground">A look back at what you were writing on this day in the past.</p>
      </div>

      {memories.map((memory, idx) => (
        <section key={idx}>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">{memory.icon}</div>
            <div>
              <h2 className="font-bold text-lg">{memory.label}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(
                  memory.journals[0]?.created_at
                    ? new Date(memory.journals[0].created_at)
                    : new Date(),
                  'MMMM d, yyyy'
                )}
              </p>
            </div>
          </div>

          {/* Memory cards */}
          <div className="space-y-4">
            {memory.journals.map(journal => {
              const mood = MOODS.find(m => m.id === journal.mood)
              const photos = (journal as any).journal_photos?.map((p: any) => p.photo_url) || []

              return (
                <Link key={journal.id} href={`/entry/${journal.id}`}>
                  <div className="glass rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                    {/* Photo banner */}
                    {photos[0] && (
                      <div className="relative h-36 w-full">
                        <Image
                          src={photos[0]}
                          alt="Memory photo"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="600px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {mood && (
                          <span className="text-lg">{mood.emoji}</span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(journal.created_at), 'h:mm a')}
                        </span>
                      </div>
                      {journal.title && (
                        <h3 className="font-bold text-base font-[family-name:var(--font-heading)] mb-1">
                          {journal.title}
                        </h3>
                      )}
                      <p className="text-muted-foreground text-sm line-clamp-2">{journal.content}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
