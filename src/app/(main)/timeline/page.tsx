'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { format, parseISO } from 'date-fns'
import { Loader2, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'

export default function TimelinePage() {
  const [journalsByMonth, setJournalsByMonth] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function fetchTimeline() {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('journals')
          .select('*, journal_photos(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Group by month
        const grouped = (data || []).reduce((acc: Record<string, any[]>, journal) => {
          const monthYear = format(parseISO(journal.created_at), 'MMMM yyyy')
          if (!acc[monthYear]) acc[monthYear] = []
          acc[monthYear].push(journal)
          return acc
        }, {})

        setJournalsByMonth(grouped)
      } catch (error) {
        console.error('Error fetching timeline:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [user, supabase])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Your Timeline</h1>
          <p className="text-muted-foreground mt-1">A journey through your past entries.</p>
        </div>
      </div>

      {Object.keys(journalsByMonth).length === 0 ? (
        <div className="text-center p-12 glass rounded-2xl">
          <p className="text-muted-foreground">Your timeline is empty.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(journalsByMonth).map(([month, journals]) => (
            <div key={month} className="relative">
              <div className="sticky top-16 z-20 py-2 bg-background/80 backdrop-blur-md">
                <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-primary">{month}</h2>
              </div>
              
              <div className="mt-4 ml-4 sm:ml-8 border-l-2 border-border pl-6 sm:pl-8 space-y-8">
                {journals.map((journal) => (
                  <div key={journal.id} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />
                    
                    <Link href={`/entry/${journal.id}`} className="block">
                      <div className="glass rounded-xl p-4 sm:p-5 transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          {format(parseISO(journal.created_at), 'EEEE, MMMM do')}
                        </div>
                        <h3 className="text-lg font-bold mb-2 font-[family-name:var(--font-heading)] group-hover:text-primary transition-colors">
                          {journal.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {journal.content}
                        </p>
                        {(journal as any).journal_photos?.length > 0 && (
                          <div className="mt-3 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md">
                            📸 {(journal as any).journal_photos.length} Photo{(journal as any).journal_photos.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
