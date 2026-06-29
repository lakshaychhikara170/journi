'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'
import { useTheme } from '@/components/theme-provider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Download, Upload, Trash2, LogOut, Loader2, AlertTriangle, ShieldCheck, Bell, Lock, Globe, Mail, Smartphone } from 'lucide-react'
import { InstallAppButton } from '@/components/install-app-button'

// Simple custom Switch component
function Switch({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) {
  return (
    <button 
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { setProfile } = useAuthStore()
  const supabase = createClient()
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Settings State
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [friendNotifs, setFriendNotifs] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(false)
  const [defaultVisibility, setDefaultVisibility] = useState('private')

  // Sync state with profile once loaded
  useEffect(() => {
    if (profile) {
      setEmailNotifs(profile.email_updates ?? true)
      setFriendNotifs(profile.friend_activity ?? true)
      setDailyReminder(profile.daily_reminder ?? false)
      setDefaultVisibility(profile.default_visibility ?? 'private')
    }
  }, [profile])
  
  const updatePreference = async (key: string, value: any) => {
    if (!profile) return;
    
    // Optimistic update locally
    setProfile({ ...profile, [key]: value } as any);
    
    try {
      const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', profile.id)
      if (error) throw error
    } catch (e: any) {
      console.error("Supabase update error:", e)
      toast.error(`Failed to save preference: ${e.message || 'Unknown error'}`)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const loadingToast = toast.loading('Sending reset email...');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent!', { id: loadingToast });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email', { id: loadingToast });
    }
  }
  
  const testMockEmail = async (type: string) => {
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      toast.success(`Mock ${type} email dispatched! Check server console.`)
    } catch (e) {
      toast.error('Failed to dispatch mock email')
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) throw new Error('Failed to export data')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `journi-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Your data has been exported successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Could not export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const toastId = toast.loading('Importing entries...')
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid backup file format')
      }

      // Ensure imported entries belong to the current user
      const isCrossAccount = data.user && data.user !== user?.id
      
      const entriesToImport = data.entries.map((entry: any) => {
        const newEntry = { ...entry, user_id: user?.id }
        // If importing from a different account, strip the ID so it creates new rows
        // instead of throwing RLS errors trying to update another user's rows.
        if (isCrossAccount) {
          delete newEntry.id
        }
        return newEntry
      })

      if (entriesToImport.length === 0) {
        throw new Error('No entries found in the backup file.')
      }

      // Upsert into Supabase
      // If 'id' is missing (cross-account), it will cleanly INSERT. 
      // If 'id' exists, it will UPSERT.
      const { error } = await supabase
        .from('journals')
        .upsert(entriesToImport, { onConflict: 'id' })

      if (error) {
        console.error("Supabase error:", JSON.stringify(error, null, 2))
        throw new Error(error.message || 'Database error occurred')
      }
      
      toast.success(`Successfully imported ${entriesToImport.length} entries!`, { id: toastId })
    } catch (error: any) {
      console.error("Full error:", error)
      toast.error(error?.message || error?.details || 'Failed to import data', { id: toastId })
    } finally {
      setIsImporting(false)
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-6">
        
        {/* Data Ownership Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Data & Privacy</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            You own your data. Download a complete archive of your journal entries at any time, or restore them from a previous backup.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleExportData} 
              disabled={isExporting || isImporting}
              className="rounded-xl flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export All Entries (JSON)
            </Button>
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting || isImporting}
              className="rounded-xl flex-1 border-primary/20 hover:bg-primary/5"
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import Entries (JSON)
            </Button>
          </div>
        </section>

        {/* Admin Mode Section */}
        {profile?.is_admin && (
          <section className="bg-red-500/10 border-red-500/20 backdrop-blur-sm border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 flex items-center justify-center text-xl">🛡️</div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Admin Mode</h2>
            </div>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
              You have administrator access. You can view all users and system stats.
            </p>
            <Link href="/admin">
              <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20">
                Open Admin Dashboard
              </Button>
            </Link>
          </section>
        )}

        {/* App Installation Section */}
        <section className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Install Journi App</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Install Journi on your device for a faster, app-like experience. You can access it directly from your home screen!
          </p>
          <div className="flex items-center">
            <InstallAppButton />
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold">Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Default Entry Visibility</p>
                <p className="text-xs text-muted-foreground">Who can see your new journals by default.</p>
              </div>
              <div className="flex bg-secondary/50 rounded-xl p-1 border">
                <Button variant={defaultVisibility === 'private' ? 'default' : 'ghost'} size="sm" className="rounded-lg text-xs px-3" onClick={() => { setDefaultVisibility('private'); updatePreference('default_visibility', 'private'); }}>Private</Button>
                <Button variant={defaultVisibility === 'friends' ? 'default' : 'ghost'} size="sm" className="rounded-lg text-xs px-3" onClick={() => { setDefaultVisibility('friends'); updatePreference('default_visibility', 'friends'); }}>Friends</Button>
                <Button variant={defaultVisibility === 'public' ? 'default' : 'ghost'} size="sm" className="rounded-lg text-xs px-3" onClick={() => { setDefaultVisibility('public'); updatePreference('default_visibility', 'public'); }}>Public</Button>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Daily Reminder</p>
                <p className="text-xs text-muted-foreground">Remind me to journal every evening.</p>
              </div>
              <Switch checked={dailyReminder} onCheckedChange={(v) => { setDailyReminder(v); updatePreference('daily_reminder', v); }} />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Email Updates</p>
                <p className="text-xs text-muted-foreground">Receive weekly summaries and tips.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => testMockEmail('summary')} className="rounded-xl text-xs h-6 px-2">Test Mock API</Button>
                <Switch checked={emailNotifs} onCheckedChange={(v) => { setEmailNotifs(v); updatePreference('email_updates', v); }} />
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Friend Activity</p>
                <p className="text-xs text-muted-foreground">Notify me when friends post or react to me.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => testMockEmail('friend_activity')} className="rounded-xl text-xs h-6 px-2">Test Mock API</Button>
                <Switch checked={friendNotifs} onCheckedChange={(v) => { setFriendNotifs(v); updatePreference('friend_activity', v); }} />
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">🎨</div>
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">App Theme</p>
              <div className="flex bg-secondary/50 rounded-xl p-1 border">
                <Button 
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  className="flex-1 rounded-lg text-xs" 
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  className="flex-1 rounded-lg text-xs" 
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button 
                  variant={theme === 'amoled' ? 'default' : 'ghost'}
                  className="flex-1 rounded-lg text-xs" 
                  onClick={() => setTheme('amoled')}
                >
                  AMOLED
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">👤</div>
            <h2 className="text-xl font-bold">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Email Address</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out of your account on this device.</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="rounded-xl">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-foreground" />
            <h2 className="text-xl font-bold">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="font-medium">Password Reset</h3>
                    <p className="text-sm text-muted-foreground">We&apos;ll email you a secure link to reset your password.</p>
                  </div>
              <Button variant="outline" size="sm" onClick={handlePasswordReset} className="rounded-xl">
                Update
              </Button>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast('2FA is coming soon.')} className="rounded-xl">
                Enable
              </Button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          <Button 
            variant="destructive" 
            className="rounded-xl w-full sm:w-auto font-medium shadow-lg shadow-destructive/20 hover:bg-destructive"
            onClick={() => {
              toast.error('Account deletion is disabled in this demo.')
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </section>

      </div>
    </div>
  )
}
