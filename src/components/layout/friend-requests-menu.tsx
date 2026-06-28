'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Bell, UserPlus, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Profile } from '@/types'

type FriendRequest = {
  id: string
  requester_id: string
  created_at: string
  requester?: Profile
}

export function FriendRequestsMenu() {
  const { user } = useAuth()
  const supabase = createClient()
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  useEffect(() => {
    if (user) {
      fetchRequests()
      
      const channel = supabase.channel('friendships_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${user.id}` }, () => {
          fetchRequests()
        })
        .subscribe()
        
      return () => {
        supabase.removeChannel(channel)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchRequests() {
    if (!user) return
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, created_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error(error)
      setIsLoading(false)
      return
    }
    
    if (data && data.length > 0) {
      const requesterIds = [...new Set(data.map(r => r.requester_id))]
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', requesterIds)
      
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, Profile>)
      
      setRequests(data.map(req => ({
        ...req,
        requester: profileMap[req.requester_id]
      })))
    } else {
      setRequests([])
    }
    setIsLoading(false)
  }

  async function handleAction(requestId: string, status: 'accepted' | 'rejected') {
    setActionLoading(requestId)
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', requestId)
      
    if (error) {
      toast.error(`Failed to ${status === 'accepted' ? 'accept' : 'reject'} request`)
    } else {
      toast.success(status === 'accepted' ? 'Friend request accepted!' : 'Friend request rejected')
      setRequests(prev => prev.filter(r => r.id !== requestId))
    }
    setActionLoading(null)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary relative transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <UserPlus className="w-5 h-5" />
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-background text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
            {requests.length > 9 ? '9+' : requests.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden" sideOffset={8}>
        <div className="flex items-center gap-2 p-3 bg-muted/30 text-sm font-semibold text-foreground">
          <UserPlus className="w-4 h-4 text-primary" /> 
          <span>Friend Requests</span>
        </div>
        <DropdownMenuSeparator className="m-0" />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 opacity-20" />
            <p>No pending requests</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={req.requester?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {req.requester?.full_name?.charAt(0) || req.requester?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{req.requester?.full_name || req.requester?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{req.requester?.username}</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 ml-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8 rounded-full text-green-500 border-green-500/20 hover:text-green-600 hover:bg-green-500/10 hover:border-green-500/30"
                    onClick={(e) => { e.preventDefault(); handleAction(req.id, 'accepted'); }}
                    disabled={actionLoading === req.id}
                  >
                    {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8 rounded-full text-destructive border-destructive/20 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    onClick={(e) => { e.preventDefault(); handleAction(req.id, 'rejected'); }}
                    disabled={actionLoading === req.id}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
