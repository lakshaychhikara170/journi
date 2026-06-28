'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Ban, CheckCircle, Shield } from 'lucide-react'

export function AdminUserList({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const supabase = createClient()

  const toggleBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u))
      toast.success(currentBanStatus ? 'User unbanned' : 'User banned')
    } catch (error: any) {
      toast.error('Failed to update ban status')
      console.error(error)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((u: any) => (
            <Dialog key={u.id}>
              <DialogTrigger className="w-full text-left appearance-none">
                <div className="flex items-center gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-secondary/50 p-2 rounded-xl transition-colors">
                  <Avatar className="w-10 h-10 border border-primary/20">
                    <AvatarImage src={u.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {u.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                      {u.full_name || u.username}
                      {u.is_admin && <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-500">ADMIN</Badge>}
                      {u.is_banned && <Badge variant="outline" className="text-[10px] bg-red-500 text-white">BANNED</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>User Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <Avatar className="w-24 h-24 border border-primary/20">
                    <AvatarImage src={u.avatar_url || ''} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {u.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{u.full_name || u.username}</h3>
                    <p className="text-sm text-muted-foreground">@{u.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center mt-4 w-full">
                    <Link href={`/profile/${u.username}`}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        View Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant={u.is_banned ? "default" : "destructive"} 
                      onClick={() => toggleBan(u.id, u.is_banned)}
                      className="w-full sm:w-auto"
                      disabled={u.is_admin}
                    >
                      {u.is_banned ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Unban User</>
                      ) : (
                        <><Ban className="w-4 h-4 mr-2" /> Ban User</>
                      )}
                    </Button>
                  </div>
                  {u.is_admin && <p className="text-xs text-red-500">Admins cannot be banned.</p>}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
