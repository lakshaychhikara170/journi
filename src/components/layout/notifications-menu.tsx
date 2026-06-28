'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Bell, MessageCircle, Heart, UserCheck, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import type { Notification, Profile } from '@/types'
import Link from 'next/link'

type NotificationWithProfile = Notification & { sender?: Profile }

export function NotificationsMenu() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<NotificationWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (user) {
      fetchNotifications()
      
      const channel = supabase.channel('notifications_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${user.id}` }, () => {
          fetchNotifications()
        })
        .subscribe()
        
      return () => {
        supabase.removeChannel(channel)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchNotifications() {
    if (!user) return
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      
    if (error) {
      console.error(error)
      setIsLoading(false)
      return
    }
    
    if (data && data.length > 0) {
      const senderIds = [...new Set(data.map(n => n.sender_id).filter(Boolean))] as string[]
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', senderIds)
      
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, Profile>)
      
      setNotifications(data.map(n => ({
        ...n,
        sender: n.sender_id ? profileMap[n.sender_id] : undefined
      })))
    } else {
      setNotifications([])
    }
    setIsLoading(false)
  }

  async function markAsRead(notificationId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', user!.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="w-3 h-3 text-blue-500" />
      case 'like': return <Heart className="w-3 h-3 text-red-500" />
      case 'reaction': return <span className="text-[10px] leading-none">✨</span>
      case 'friend_request': return <UserCheck className="w-3 h-3 text-amber-500" />
      case 'friend_accepted': return <UserCheck className="w-3 h-3 text-green-500" />
      default: return <Bell className="w-3 h-3 text-primary" />
    }
  }

  const getLink = (n: NotificationWithProfile) => {
    if (n.type === 'comment' || n.type === 'like' || n.type === 'reaction') {
      return `/feed` 
    }
    return '#'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary relative transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-primary rounded-full border-2 border-background text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden" sideOffset={8}>
        <div className="flex items-center justify-between p-3 bg-muted/30 text-sm font-semibold text-foreground">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> 
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <button onClick={(e) => { e.preventDefault(); markAllAsRead(); }} className="text-xs text-primary hover:underline font-normal">
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 opacity-20" />
            <p>No new notifications</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => (
              <Link 
                key={n.id} 
                href={getLink(n)}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`flex gap-3 p-3 border-b last:border-0 hover:bg-muted/30 transition-colors block cursor-pointer ${n.is_read ? 'opacity-70' : 'bg-primary/5'}`}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={n.sender?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {n.sender?.full_name?.charAt(0) || n.sender?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border shadow-sm flex items-center justify-center w-5 h-5">
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm leading-tight text-foreground">
                    {n.message || `New ${n.type} notification`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
