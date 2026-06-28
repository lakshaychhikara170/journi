'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JournalCard } from '@/components/journal/journal-card'
import { Loader2, Bookmark } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SavedPage() {
  const [journals, setJournals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchSaved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchSaved() {
    setIsLoading(true)
    
    const { data: savedData } = await supabase
      .from('saved_journals')
      .select('journal_id')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!savedData || savedData.length === 0) {
      setJournals([])
      setIsLoading(false)
      return
    }

    const journalIds = savedData.map(s => s.journal_id)

    const { data: journalData } = await supabase
      .from('journals')
      .select('*, profiles:user_id (*)')
      .in('id', journalIds)
      .order('created_at', { ascending: false })

    if (journalData && journalData.length > 0) {
      const { data: photosData } = await supabase
        .from('journal_photos')
        .select('*')
        .in('journal_id', journalIds)

      const photosMap: Record<string, any[]> = {}
      for (const photo of (photosData || [])) {
        if (!photosMap[photo.journal_id]) photosMap[photo.journal_id] = []
        photosMap[photo.journal_id].push(photo)
      }

      setJournals(journalData.map((j: any) => ({ ...j, journal_photos: photosMap[j.id] || [] })))
    } else {
      setJournals([])
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Bookmark className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Saved</h1>
          <p className="text-muted-foreground text-sm">Journals you&apos;ve bookmarked</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center p-12 glass rounded-2xl">
          <div className="text-6xl mb-4">🔖</div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-2">Nothing saved yet</h2>
          <p className="text-muted-foreground mb-6">Tap the bookmark icon on any journal to save it here.</p>
          <Link href="/feed" passHref>
            <Button className="rounded-xl">Browse Feed</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
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
