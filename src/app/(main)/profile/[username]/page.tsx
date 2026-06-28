'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { Loader2, UserPlus, UserCheck, Clock, BookOpen, Users, Heart, ArrowLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { JournalCard } from '@/components/journal/journal-card'
import { toast } from 'sonner'
import { sounds } from '@/lib/sounds'
import Link from 'next/link'
import type { Profile } from '@/types'

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [journals, setJournals] = useState<any[]>([])
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [stats, setStats] = useState({ entries: 0, friends: 0, reactions: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isFriendLoading, setIsFriendLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  async function fetchProfile() {
    setIsLoading(true)

    // 1. Fetch the profile by username
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !profileData) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setProfile(profileData)
    const targetUserId = profileData.id

    // 2. Check friendship status
    if (user && user.id !== targetUserId) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
        .limit(1)
        .maybeSingle()

      if (friendship) {
        setFriendshipId(friendship.id)
        if (friendship.status === 'accepted') {
          setFriendStatus('accepted')
        } else if (friendship.requester_id === user.id) {
          setFriendStatus('pending_sent')
        } else {
          setFriendStatus('pending_received')
        }
      }
    }

    // 3. Fetch stats
    const [entriesRes, friendsRes, reactionsRes] = await Promise.all([
      supabase.from('journals').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
      supabase.from('friendships').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`),
      supabase.from('reactions').select('*', { count: 'exact', head: true })
        .in('journal_id', (await supabase.from('journals').select('id').eq('user_id', targetUserId)).data?.map(j => j.id) || []),
    ])

    setStats({
      entries: entriesRes.count || 0,
      friends: friendsRes.count || 0,
      reactions: reactionsRes.count || 0,
    })

    // 4. Fetch their visible journals
    let journalQuery = supabase
      .from('journals')
      .select('*, profiles:user_id (*)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    // If not the same user and not friends, only show public
    if (user && user.id === targetUserId) {
      // Show all own journals
    } else if (friendStatus === 'accepted') {
      journalQuery = journalQuery.in('visibility', ['public', 'friends'])
    } else {
      journalQuery = journalQuery.eq('visibility', 'public')
    }

    const { data: journalData } = await journalQuery

    if (journalData && journalData.length > 0) {
      const journalIds = journalData.map((j: any) => j.id)
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

  async function sendFriendRequest() {
    if (!user || !profile) return
    setIsFriendLoading(true)

    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: profile.id,
      status: 'pending',
    })

    if (!error) {
      setFriendStatus('pending_sent')
      sounds.success()
      toast.success('Friend request sent!')

      // Send notification
      await supabase.from('notifications').insert({
        receiver_id: profile.id,
        sender_id: user.id,
        type: 'friend_request',
        message: `Someone sent you a friend request`,
      })
    } else {
      toast.error('Failed to send request')
    }
    setIsFriendLoading(false)
  }

  async function acceptFriendRequest() {
    if (!friendshipId || !user || !profile) return
    setIsFriendLoading(true)

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (!error) {
      setFriendStatus('accepted')
      sounds.success()
      toast.success('Friend request accepted!')

      await supabase.from('notifications').insert({
        receiver_id: profile.id,
        sender_id: user.id,
        type: 'friend_accepted',
        message: `Someone accepted your friend request`,
      })
    }
    setIsFriendLoading(false)
  }

  async function removeFriend() {
    if (!friendshipId) return
    setIsFriendLoading(true)

    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendStatus('none')
    setFriendshipId(null)
    toast.success('Friend removed')
    setIsFriendLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <div className="text-6xl">🔍</div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">User not found</h1>
        <p className="text-muted-foreground">No user with username @{username} exists.</p>
        <Link href="/feed">
          <Button className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Button>
        </Link>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  const statCards = [
    { label: 'Entries', value: stats.entries, icon: '📖', color: 'from-primary/10 to-violet-500/10 border-primary/20', textColor: 'text-primary' },
    { label: 'Friends', value: stats.friends, icon: '👥', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20', textColor: 'text-blue-500' },
    { label: 'Reactions', value: stats.reactions, icon: '❤️', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20', textColor: 'text-pink-500' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back button */}
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      {/* Profile Header */}
      <div className="glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-violet-600 rounded-full blur-lg opacity-30" />
            <Avatar className="w-28 h-28 border-4 border-background shadow-2xl relative">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {profile.full_name?.charAt(0) || profile.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">{profile.full_name || profile.username}</h1>
            <p className="text-muted-foreground text-lg mb-3">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm max-w-md mx-auto sm:mx-0 text-foreground/80 leading-relaxed">{profile.bio}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</p>

            {/* Friend Actions */}
            {!isOwnProfile && user && (
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
                {friendStatus === 'none' && (
                  <Button onClick={sendFriendRequest} disabled={isFriendLoading} className="rounded-xl font-medium gap-2">
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </Button>
                )}
                {friendStatus === 'pending_sent' && (
                  <Button disabled variant="secondary" className="rounded-xl font-medium gap-2">
                    <Clock className="w-4 h-4" /> Request Sent
                  </Button>
                )}
                {friendStatus === 'pending_received' && (
                  <Button onClick={acceptFriendRequest} disabled={isFriendLoading} className="rounded-xl font-medium gap-2">
                    <UserCheck className="w-4 h-4" /> Accept Request
                  </Button>
                )}
                {friendStatus === 'accepted' && (
                  <Button onClick={removeFriend} disabled={isFriendLoading} variant="outline" className="rounded-xl font-medium gap-2 border-green-500/30 text-green-600">
                    <UserCheck className="w-4 h-4" /> Friends ✓
                  </Button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="mt-4">
                <Link href="/profile">
                  <Button variant="secondary" className="rounded-xl font-medium gap-2">Edit Profile</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat, i) => (
          <div key={i} className={`glass rounded-2xl p-4 border bg-gradient-to-br ${stat.color} text-center transition-transform hover:-translate-y-0.5`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <span className={`text-2xl font-bold font-[family-name:var(--font-heading)] ${stat.textColor}`}>{stat.value}</span>
            <p className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Their Journals */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
          {isOwnProfile ? 'Your Journals' : `${profile.full_name || profile.username}'s Journals`}
        </h2>

        {journals.length === 0 ? (
          <div className="text-center p-8 glass rounded-2xl">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-muted-foreground text-sm">
              {friendStatus === 'accepted' 
                ? 'No journals to show yet.' 
                : 'Only public journals are visible. Add them as a friend to see more!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {journals.map((journal) => (
              <JournalCard
                key={journal.id}
                entry={journal}
                author={journal.profiles || profile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
