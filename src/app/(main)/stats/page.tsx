'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, TrendingUp, Calendar as CalendarIcon, Activity } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { MOODS } from '@/lib/constants'
import type { Journal } from '@/types'

export default function StatsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [journals, setJournals] = useState<Journal[]>([])
  
  useEffect(() => {
    if (user) fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchStats() {
    setIsLoading(true)
    
    // Fetch last 3 months of journals
    const threeMonthsAgo = subMonths(new Date(), 3).toISOString()
    
    const { data } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user!.id)
      .gte('created_at', threeMonthsAgo)
      .order('created_at', { ascending: true })

    setJournals((data as Journal[]) || [])
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate Activity Over Time (Entries per week)
  const activityData = []
  if (journals.length > 0) {
    const start = parseISO(journals[0].created_at)
    const end = new Date()
    const days = eachDayOfInterval({ start, end })
    
    // Group by week
    const weeks: Record<string, number> = {}
    days.forEach(day => {
      const weekStr = format(day, "MMM d") // Simplified
      if (!weeks[weekStr]) weeks[weekStr] = 0
    })
    
    journals.forEach(j => {
      const weekStr = format(parseISO(j.created_at), "MMM d")
      if (weeks[weekStr] !== undefined) weeks[weekStr]++
    })
    
    // Convert to array and sample every 3rd day to avoid crowding
    let i = 0
    for (const [date, count] of Object.entries(weeks)) {
      if (i % 3 === 0 || count > 0) {
        activityData.push({ date, count })
      }
      i++
    }
  }

  // Calculate Mood Frequency
  const moodCounts: Record<string, number> = {}
  journals.forEach(j => {
    if (j.mood) {
      moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1
    }
  })

  const moodData = Object.entries(moodCounts)
    .map(([moodId, count]) => {
      const moodDef = MOODS.find(m => m.id === moodId)
      return {
        name: moodDef?.label || moodId,
        emoji: moodDef?.emoji || '😐',
        count,
        color: moodDef?.color || '#8884d8'
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 moods

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Your Analytics</h1>
        <p className="text-muted-foreground mt-1">Discover insights about your journaling habits over the last 3 months.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="glass rounded-3xl p-6 border bg-gradient-to-br from-background to-primary/5">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Writing Activity</h2>
          </div>
          <div className="h-[250px] w-full">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Not enough data yet
              </div>
            )}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="glass rounded-3xl p-6 border bg-gradient-to-br from-background to-secondary/50">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-secondary-foreground" />
            <h2 className="font-semibold text-lg">Top Moods</h2>
          </div>
          <div className="h-[250px] w-full">
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No moods logged yet
              </div>
            )}
          </div>
          
          {/* Mood legend */}
          {moodData.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {moodData.map(m => (
                <div key={m.name} className="flex items-center gap-1.5 text-sm">
                  <span>{m.emoji}</span>
                  <span className="text-muted-foreground">{m.name} ({m.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 border text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Entries (90d)</p>
          <p className="text-3xl font-bold">{journals.length}</p>
        </div>
        <div className="glass rounded-2xl p-5 border text-center">
          <p className="text-sm text-muted-foreground mb-1">Avg Entries / Week</p>
          <p className="text-3xl font-bold">
            {journals.length > 0 ? (journals.length / 12).toFixed(1) : '0'}
          </p>
        </div>
        <div className="glass rounded-2xl p-5 border text-center col-span-2">
          <p className="text-sm text-muted-foreground mb-1">Most Active Day</p>
          <p className="text-2xl font-bold flex items-center justify-center gap-2 mt-1">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {activityData.length > 0 
              ? activityData.reduce((prev, current) => (prev.count > current.count) ? prev : current).date 
              : 'N/A'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
