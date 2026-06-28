import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, HardDrive } from 'lucide-react'
import { AdminUserList } from './components/admin-user-list'
import { AdminJournalFeed } from './components/admin-journal-feed'

export const metadata = {
  title: 'Admin Dashboard | Journi',
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Fetch some stats
  const { count: userCount, data: users } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: journalCount } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })

  // Since we bypass RLS, this actually returns all journals
  const { data: recentJournals } = await supabase
    .from('journals')
    .select('id, title, created_at, profiles:user_id(username)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">System Overview</h1>
        <p className="text-muted-foreground mt-1">Global statistics and recent activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Journals</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalCount || 0}</div>
            <p className="text-xs text-muted-foreground">Entries worldwide</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <HardDrive className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Interactive User List */}
        <AdminUserList initialUsers={users || []} />

        {/* Interactive Global Activity */}
        <AdminJournalFeed initialJournals={recentJournals || []} />
      </div>
    </div>
  )
}
