import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get user session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile to check is_admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    // If not an admin, redirect them out immediately
    redirect('/feed')
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
          <div className="text-2xl">🛡️</div>
          <div>
            <h2 className="font-bold text-red-600 dark:text-red-400">Administrator Mode Active</h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">You have god-mode access. Be careful.</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
