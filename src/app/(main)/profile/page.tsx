'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Edit2, LogOut, Loader2, BookOpen, Users, Heart, Trophy, Flame, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog'
import { BADGE_DEFINITIONS } from '@/lib/gamification'

interface ProfileStats {
  totalEntries: number
  totalFriends: number
  totalReactions: number
  joinedDate: string | null
}

export default function ProfilePage() {
  const { user, profile, streak, isLoading, signOut } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = useState<ProfileStats>({ totalEntries: 0, totalFriends: 0, totalReactions: 0, joinedDate: null })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchStats() {
    setStatsLoading(true)
    const [entriesRes, friendsRes, reactionsRes] = await Promise.all([
      supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('friendships').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`),
      supabase.from('reactions').select('journal_id, journals!inner(user_id)', { count: 'exact', head: true })
        .eq('journals.user_id', user!.id),
    ])

    setStats({
      totalEntries: entriesRes.count || 0,
      totalFriends: friendsRes.count || 0,
      totalReactions: reactionsRes.count || 0,
      joinedDate: profile?.created_at || null,
    })
    setStatsLoading(false)
  }

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    { label: 'Current Streak', value: profile?.current_streak || 0, unit: 'days', icon: '🔥', color: 'from-orange-500/10 to-red-500/10 border-orange-500/20', textColor: 'text-orange-500' },
    { label: 'Longest Streak', value: profile?.longest_streak || 0, unit: 'days', icon: '🏆', color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20', textColor: 'text-amber-500' },
    { label: 'Total Entries', value: stats.totalEntries, unit: '', icon: '📖', color: 'from-primary/10 to-violet-500/10 border-primary/20', textColor: 'text-primary' },
    { label: 'Friends', value: stats.totalFriends, unit: '', icon: '👥', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20', textColor: 'text-blue-500' },
    { label: 'Reactions Received', value: stats.totalReactions, unit: '', icon: '❤️', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20', textColor: 'text-pink-500' },
    { label: 'Member Since', value: stats.joinedDate ? format(new Date(stats.joinedDate), 'MMM yyyy') : '—', unit: '', icon: '✨', color: 'from-green-500/10 to-emerald-500/10 border-green-500/20', textColor: 'text-green-500' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Profile Header Card */}
      <div className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        {/* Settings button - absolute positioned in top right */}
        <div className="absolute top-4 right-4 z-20">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-md">
              <Settings className="w-5 h-5 text-foreground" />
            </Button>
          </Link>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-violet-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <Avatar className="w-32 h-32 border-4 border-background shadow-2xl relative">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || profile.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">{profile.full_name || 'Journaler'}</h1>
            <p className="text-muted-foreground text-lg mb-3">@{profile.username}</p>
            {profile.bio ? (
              <p className="text-sm max-w-md mx-auto sm:mx-0 text-foreground/80 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">No bio yet. Click edit to add one.</p>
            )}
            
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
              <EditProfileDialog>
                <Button className="rounded-xl font-medium gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </Button>
              </EditProfileDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Your Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCards.map((stat, i) => (
            <div key={i} className={`glass rounded-2xl p-4 border bg-gradient-to-br ${stat.color} transition-transform hover:-translate-y-0.5`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold font-[family-name:var(--font-heading)] ${stat.textColor}`}>
                  {statsLoading ? '—' : stat.value}
                </span>
                {stat.unit && <span className="text-xs text-muted-foreground">{stat.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges Case */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Badges Case</h2>
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(BADGE_DEFINITIONS).map((badge) => {
              const isUnlocked = profile.earned_badges?.includes(badge.id);
              return (
                <motion.div 
                  key={badge.id} 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={isUnlocked ? { scale: 1.05 } : {}}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isUnlocked 
                      ? 'bg-primary/10 border-primary/20 text-foreground shadow-sm shadow-primary/5 ring-1 ring-primary/20' 
                      : 'bg-card/50 border-border/50 text-muted-foreground opacity-60 grayscale'
                  }`}
                >
                  <span className={`text-2xl ${isUnlocked ? 'drop-shadow-md animate-pulse' : ''}`}>{badge.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${isUnlocked ? 'text-primary' : ''}`}>{badge.name}</p>
                    <p className="text-xs line-clamp-2">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-4">
        <Button 
          variant="ghost" 
          className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-500/10 font-medium text-base border border-red-500/10"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* DEV TOOLS (Temporary) */}
      <div className="mt-12 pt-6 border-t border-dashed border-primary/20">
        <h2 className="text-xs font-mono text-primary uppercase tracking-widest mb-4">🔧 Dev Test Controls</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              const newStreak = (profile.current_streak || 0) + 1;
              const newLongest = Math.max(newStreak, profile.longest_streak || 0);
              
              const currentBadges = profile.earned_badges ? [...profile.earned_badges] : [];
              let newBadge = false;
              if (newStreak === 3) { if(!currentBadges.includes('streak_3')) currentBadges.push('streak_3'); useAuthStore.getState().pushBadge(BADGE_DEFINITIONS['streak_3']); }
              if (newStreak === 7) { if(!currentBadges.includes('streak_7')) currentBadges.push('streak_7'); useAuthStore.getState().pushBadge(BADGE_DEFINITIONS['streak_7']); }
              if (newStreak === 30) { if(!currentBadges.includes('streak_30')) currentBadges.push('streak_30'); useAuthStore.getState().pushBadge(BADGE_DEFINITIONS['streak_30']); }

              const { data } = await supabase.from('profiles').update({ 
                current_streak: newStreak, 
                longest_streak: newLongest,
                earned_badges: currentBadges
              }).eq('id', profile.id).select().single();
              
              if (data) useAuthStore.getState().setProfile(data as any);
            }}
          >
            +1 Day Streak
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#eab308'] });
              const allBadges = Object.keys(BADGE_DEFINITIONS);
              const { data } = await supabase.from('profiles').update({ earned_badges: allBadges }).eq('id', profile.id).select().single();
              if (data) useAuthStore.getState().setProfile(data as any);
            }}
          >
            Unlock All Badges
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={async () => {
              const { data } = await supabase.from('profiles').update({ current_streak: 0, longest_streak: 0, earned_badges: [] }).eq('id', profile.id).select().single();
              if (data) useAuthStore.getState().setProfile(data as any);
            }}
          >
            Reset All Stats
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              useAuthStore.getState().pushBadge({
                id: 'test_badge',
                name: 'Legendary Journaler',
                description: "You've achieved legendary status! Absolutely incredible!",
                icon: '👑'
              })
            }}
          >
            Trigger Celebration
          </Button>
        </div>
      </div>
    </div>
  )
}
