'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { UserPlus, UserCheck, Clock, UserMinus, Loader2, Search, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { sounds } from '@/lib/sounds'
import type { Profile, Friendship } from '@/types'

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

interface UserWithStatus extends Profile {
  friendshipStatus: FriendshipStatus
  friendshipId?: string
}

export default function FriendsPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<UserWithStatus[]>([])
  const [friends, setFriends] = useState<UserWithStatus[]>([])
  const [pendingIn, setPendingIn] = useState<UserWithStatus[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) loadFriends()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadFriends() {
    setIsLoading(true)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)

    if (!friendships || friendships.length === 0) { 
      setFriends([])
      setPendingIn([])
      setIsLoading(false)
      return 
    }

    // Get all unique user IDs involved in these friendships (excluding current user)
    const otherUserIds = Array.from(new Set(friendships.map(f => 
      f.requester_id === user!.id ? f.addressee_id : f.requester_id
    )))

    // Fetch their profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', otherUserIds)

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]))

    const accepted: UserWithStatus[] = []
    const inbound: UserWithStatus[] = []

    for (const f of friendships) {
      const isRequester = f.requester_id === user!.id
      const otherId = isRequester ? f.addressee_id : f.requester_id
      const otherProfile = profilesMap.get(otherId)

      if (!otherProfile) continue

      if (f.status === 'accepted') {
        accepted.push({ ...otherProfile, friendshipStatus: 'accepted', friendshipId: f.id } as UserWithStatus)
      } else if (f.status === 'pending' && !isRequester) {
        inbound.push({ ...otherProfile, friendshipStatus: 'pending_received', friendshipId: f.id } as UserWithStatus)
      }
    }

    setFriends(accepted)
    setPendingIn(inbound)
    setIsLoading(false)
  }

  async function searchUsers(q: string) {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    setIsSearching(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user!.id)
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10)

    if (!profiles) { setIsSearching(false); return }

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)

    const statusMap: Record<string, { status: FriendshipStatus; id: string }> = {}
    for (const f of (friendships || [])) {
      const otherId = f.requester_id === user!.id ? f.addressee_id : f.requester_id
      if (f.status === 'accepted') statusMap[otherId] = { status: 'accepted', id: f.id }
      else if (f.status === 'pending' && f.requester_id === user!.id) statusMap[otherId] = { status: 'pending_sent', id: f.id }
      else if (f.status === 'pending' && f.addressee_id === user!.id) statusMap[otherId] = { status: 'pending_received', id: f.id }
    }

    setResults(profiles.map(p => ({
      ...p,
      friendshipStatus: statusMap[p.id]?.status || 'none',
      friendshipId: statusMap[p.id]?.id,
    })))
    setIsSearching(false)
  }

  async function sendRequest(addresseeId: string) {
    const { error } = await supabase.from('friendships').insert({
      requester_id: user!.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    if (error) { toast.error('Could not send request'); return }
    await supabase.from('notifications').insert({
      receiver_id: addresseeId,
      sender_id: user!.id,
      type: 'friend_request',
      message: `${profile?.full_name || profile?.username || 'Someone'} sent you a friend request`
    })
    sounds.pop()
    toast.success('Friend request sent! 🎉')
    searchUsers(search)
  }

  async function acceptRequest(friendshipId: string) {
    const { data: friendship } = await supabase.from('friendships').select('requester_id').eq('id', friendshipId).single()
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    if (friendship) {
      await supabase.from('notifications').insert({
        receiver_id: friendship.requester_id,
        sender_id: user!.id,
        type: 'friend_accepted',
        message: `${profile?.full_name || profile?.username || 'Someone'} accepted your friend request`
      })
    }
    sounds.success()
    toast.success('You are now friends! 🤝')
    loadFriends()
    searchUsers(search)
  }

  async function removeConnection(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    toast.success('Connection removed.')
    loadFriends()
    searchUsers(search)
  }

  function ActionButton({ person }: { person: UserWithStatus }) {
    switch (person.friendshipStatus) {
      case 'accepted':
        return (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full"
            onClick={() => removeConnection(person.friendshipId!)}>
            <UserCheck className="w-3.5 h-3.5 text-green-500" /> Friends
          </Button>
        )
      case 'pending_sent':
        return (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full text-muted-foreground"
            onClick={() => removeConnection(person.friendshipId!)}>
            <Clock className="w-3.5 h-3.5" /> Pending
          </Button>
        )
      case 'pending_received':
        return (
          <Button size="sm" className="gap-1.5 text-xs rounded-full"
            onClick={() => acceptRequest(person.friendshipId!)}>
            <UserCheck className="w-3.5 h-3.5" /> Accept
          </Button>
        )
      default:
        return (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-full"
            onClick={() => sendRequest(person.id)}>
            <UserPlus className="w-3.5 h-3.5" /> Add
          </Button>
        )
    }
  }

  function PersonRow({ person }: { person: UserWithStatus }) {
    return (
      <div className="flex items-center gap-3 py-3">
        <Avatar className="w-10 h-10 border border-border">
          <AvatarImage src={person.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {person.full_name?.charAt(0) || person.username?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{person.full_name || person.username}</p>
          <p className="text-xs text-muted-foreground">@{person.username}</p>
        </div>
        <ActionButton person={person} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Friends</h1>
        <p className="text-muted-foreground mt-1">Connect with others and share your journey.</p>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or username…"
            value={search}
            onChange={e => { setSearch(e.target.value); searchUsers(e.target.value) }}
            className="pl-9 rounded-xl"
          />
        </div>

        {isSearching && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {results.length > 0 && (
          <div className="divide-y divide-border/50">
            {results.map(p => <PersonRow key={p.id} person={p} />)}
          </div>
        )}

        {search.length >= 2 && !isSearching && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No users found for "{search}"</p>
        )}
      </div>

      {/* Pending Requests */}
      {pendingIn.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Friend Requests
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-medium">
              {pendingIn.length} new
            </span>
          </h2>
          <div className="divide-y divide-border/50">
            {pendingIn.map(p => <PersonRow key={p.id} person={p} />)}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="glass rounded-2xl p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          My Friends
          <span className="ml-auto text-xs text-muted-foreground">{friends.length} total</span>
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No friends yet. Search for users above to connect!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {friends.map(p => <PersonRow key={p.id} person={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
