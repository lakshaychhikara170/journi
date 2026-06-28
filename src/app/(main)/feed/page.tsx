'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JournalCard } from '@/components/journal/journal-card'
import { Loader2, Globe, Users, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MOODS } from '@/lib/constants'

type FeedTab = 'all' | 'friends' | 'mine'

export default function FeedPage() {
  const [journals, setJournals] = useState<any[]>([])
  const [timeCapsules, setTimeCapsules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<FeedTab>('all')
  const supabase = createClient()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeTag = searchParams.get('tag') || null
  const activeMood = searchParams.get('mood') || null

  useEffect(() => {
    if (user) {
      fetchFeed()
      fetchTimeCapsules()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab, activeTag, activeMood])

  async function fetchTimeCapsules() {
    if (!user) return
    try {
      const today = new Date()
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      
      const { data } = await supabase
        .from('journals')
        .select('*, profiles:user_id (*)')
        .eq('user_id', user.id)
      
      if (data) {
        // Since Supabase doesn't easily do exact day/month matches across years in simple RPC without custom functions, 
        // we'll filter in memory.
        const capsules = data.filter(j => {
          const jDate = new Date(j.created_at)
          const isOneYear = jDate.getDate() === today.getDate() && jDate.getMonth() === today.getMonth() && jDate.getFullYear() === today.getFullYear() - 1
          const isOneMonth = jDate.getDate() === today.getDate() && jDate.getMonth() === oneMonthAgo.getMonth() && jDate.getFullYear() === oneMonthAgo.getFullYear()
          return isOneYear || isOneMonth
        })
        setTimeCapsules(capsules)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/feed?${params.toString()}`)
  }

  function clearFilters() {
    router.push('/feed')
  }

  async function fetchFeed() {
    if (!user) return
    setIsLoading(true)

    try {
      let query = supabase
        .from('journals')
        .select('*, profiles:user_id (*)')
        .order('created_at', { ascending: false })

      if (tab === 'friends') {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        const friendIds = (friendships || []).map(f =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        )
        
        if (friendIds.length > 0) {
          query = query.in('user_id', friendIds)
        } else {
          // No friends, return empty query by querying a non-existent ID
          query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
        }
      } else if (tab === 'mine') {
        query = query.eq('user_id', user.id)
      } else if (tab === 'all') {
        query = query.or(`user_id.eq.${user.id},visibility.eq.public`)
      }

      // Apply mood filter
      if (activeMood) {
        query = query.eq('mood', activeMood)
      }

      // Apply tag filter
      if (activeTag) {
        query = query.contains('tags', [activeTag])
      }

      const { data: journalData, error } = await query
      if (error) throw error

      // Fetch photos separately for each journal
      if (journalData && journalData.length > 0) {
        const journalIds = journalData.map((j: any) => j.id)
        const { data: photosData } = await supabase
          .from('journal_photos')
          .select('*')
          .in('journal_id', journalIds)

        // Attach photos to journals
        const photosMap: Record<string, any[]> = {}
        for (const photo of (photosData || [])) {
          if (!photosMap[photo.journal_id]) photosMap[photo.journal_id] = []
          photosMap[photo.journal_id].push(photo)
        }

        const enriched = journalData.map((j: any) => ({
          ...j,
          journal_photos: photosMap[j.id] || [],
        }))
        setJournals(enriched)
      } else {
        setJournals([])
      }
    } catch (error) {
      console.error('Error fetching feed:', error)
      setJournals([])
    } finally {
      setIsLoading(false)
    }
  }

  const hasFilters = activeTag || activeMood

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Tab toggle */}
      <div className="flex gap-2 bg-muted/40 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'all'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="w-4 h-4" />
          Discover
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'friends'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Friends
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'mine'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-base leading-none">👤</span>
          My Posts
        </button>
      </div>

      {/* Mood Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MOODS.map(mood => (
          <button
            key={mood.id}
            onClick={() => setFilter('mood', activeMood === mood.id ? null : mood.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeMood === mood.id
                ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
            }`}
          >
            <span>{mood.emoji}</span>
            {mood.label}
          </button>
        ))}
      </div>

      {/* Active filter banner */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtering by:</span>
          {activeMood && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {MOODS.find(m => m.id === activeMood)?.emoji} {MOODS.find(m => m.id === activeMood)?.label}
              <button onClick={() => setFilter('mood', null)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              #{activeTag}
              <button onClick={() => setFilter('tag', null)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline ml-auto">Clear all</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center p-12 glass rounded-2xl">
          <div className="text-6xl mb-4">{hasFilters ? '🔍' : tab === 'friends' ? '👥' : '🌱'}</div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-2">
            {hasFilters ? 'No matching journals' : tab === 'friends' ? 'Your friends haven&apos;t posted yet' : 'It&apos;s quiet here'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {hasFilters
              ? 'Try a different filter or mood to find what you&apos;re looking for.'
              : tab === 'friends'
              ? 'Connect with more people or encourage your friends to write!'
              : 'You don&apos;t have any journal entries yet.'}
          </p>
          {hasFilters ? (
            <Button onClick={clearFilters} className="rounded-xl">Clear Filters</Button>
          ) : (
            <Link href={tab === 'friends' ? '/friends' : '/entry/new'} passHref>
              <Button className="rounded-xl">
                {tab === 'friends' ? 'Find Friends' : 'Write your first entry'}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {timeCapsules.length > 0 && !hasFilters && tab === 'all' && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm shadow-primary/5 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <h3 className="text-lg font-bold font-[family-name:var(--font-heading)] flex items-center gap-2 mb-4 text-primary">
                <span>⏳</span> On This Day
              </h3>
              <div className="space-y-4">
                {timeCapsules.map(capsule => (
                  <JournalCard
                    key={`capsule-${capsule.id}`}
                    entry={capsule}
                    author={capsule.profiles}
                  />
                ))}
              </div>
            </div>
          )}

          {journals.map((journal) => (
            <JournalCard
              key={journal.id}
              entry={journal}
              author={journal.profiles}
            />
          ))}
        </div>
      )}
    </div>
  )
}
