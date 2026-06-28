'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, BookOpen, Users, Hash, Calendar, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Tab = 'journals' | 'people' | 'tags'

interface JournalResult {
  id: string
  title: string
  content: string
  mood: string | null
  created_at: string
  tags: string[] | null
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface PeopleResult {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface TagResult {
  tag: string
  count: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [activeTab, setActiveTab] = useState<Tab>('journals')
  const [journals, setJournals] = useState<JournalResult[]>([])
  const [people, setPeople] = useState<PeopleResult[]>([])
  const [tags, setTags] = useState<TagResult[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const searchJournals = useCallback(async (q: string) => {
    const { data } = await supabase
      .from('journals')
      .select('id, title, content, mood, created_at, tags, profiles(username, full_name, avatar_url)')
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20)

    return (data as unknown) as JournalResult[]
  }, [supabase])

  const searchPeople = useCallback(async (q: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(20)

    return (data || []) as PeopleResult[]
  }, [supabase])

  const searchTags = useCallback(async (q: string) => {
    const { data } = await supabase
      .from('journals')
      .select('tags')
      .eq('visibility', 'public')
      .not('tags', 'is', null)

    if (!data) return []

    const tagCounts: Record<string, number> = {}
    const lowerQ = q.toLowerCase()

    for (const row of data) {
      if (!row.tags) continue
      for (const tag of row.tags as string[]) {
        if (tag.toLowerCase().includes(lowerQ)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        }
      }
    }

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }, [supabase])

  useEffect(() => {
    if (!query.trim()) {
      setJournals([])
      setPeople([])
      setTags([])
      return
    }

    const runSearch = async () => {
      setLoading(true)
      try {
        const [j, p, t] = await Promise.all([
          searchJournals(query),
          searchPeople(query),
          searchTags(query),
        ])
        setJournals(j)
        setPeople(p)
        setTags(t)
      } finally {
        setLoading(false)
      }
    }

    runSearch()
  }, [query, searchJournals, searchPeople, searchTags])

  const tabs: { key: Tab; label: string; icon: typeof BookOpen; count: number }[] = [
    { key: 'journals', label: 'Journals', icon: BookOpen, count: journals.length },
    { key: 'people', label: 'People', icon: Users, count: people.length },
    { key: 'tags', label: 'Tags', icon: Hash, count: tags.length },
  ]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  // Empty state — no query yet
  if (!query.trim()) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-primary/60" />
          </div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-2">
            Search Journi
          </h2>
          <p className="text-muted-foreground max-w-md">
            Find journals, people, and tags. Use the search bar above to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Search heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-1">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground">
          {journals.length + people.length + tags.length} results found
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-6 rounded-xl bg-secondary/50 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {query && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Journal Results */}
      {!loading && activeTab === 'journals' && (
        <div className="space-y-3">
          {journals.length === 0 ? (
            <EmptyResults type="journals" query={query} />
          ) : (
            journals.map((journal, i) => (
              <Link
                key={journal.id}
                href={`/entry/${journal.id}`}
                className="block glass rounded-2xl p-4 hover:bg-white/10 dark:hover:bg-white/[0.03] transition-all duration-200 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {journal.mood && <span className="mr-2">{journal.mood}</span>}
                    {journal.title || 'Untitled Entry'}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(journal.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {journal.content?.substring(0, 100) || 'No content'}
                  {journal.content && journal.content.length > 100 ? '...' : ''}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={journal.profiles?.avatar_url || ''} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(journal.profiles?.full_name || journal.profiles?.username || '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {journal.profiles?.full_name || journal.profiles?.username || 'Unknown'}
                    </span>
                  </div>
                  {journal.tags && journal.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {journal.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* People Results */}
      {!loading && activeTab === 'people' && (
        <div className="space-y-3">
          {people.length === 0 ? (
            <EmptyResults type="people" query={query} />
          ) : (
            people.map((person, i) => (
              <Link
                key={person.id}
                href={`/profile/${person.username}`}
                className="flex items-center gap-4 glass rounded-2xl p-4 hover:bg-white/10 dark:hover:bg-white/[0.03] transition-all duration-200 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarImage src={person.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(person.full_name || person.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {person.full_name || person.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{person.username}</p>
                  {person.bio && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {person.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tags Results */}
      {!loading && activeTab === 'tags' && (
        <div className="space-y-3">
          {tags.length === 0 ? (
            <EmptyResults type="tags" query={query} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map((tagItem, i) => (
                <Link
                  key={tagItem.tag}
                  href={`/feed?tag=${encodeURIComponent(tagItem.tag)}`}
                  className="flex items-center gap-4 glass rounded-2xl p-4 hover:bg-white/10 dark:hover:bg-white/[0.03] transition-all duration-200 group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Hash className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      #{tagItem.tag}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tagItem.count} {tagItem.count === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyResults({ type, query }: { type: string; query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No {type} found</h3>
      <p className="text-sm text-muted-foreground">
        No {type} matching &ldquo;{query}&rdquo;. Try a different search term.
      </p>
    </div>
  )
}
