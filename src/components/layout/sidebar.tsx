'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, PlusCircle, Heart, Image as ImageIcon, Settings, LogOut, Sun, Moon, Monitor, Users, Bookmark, Search, Activity, Map as MapIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/components/theme-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InstallAppButton } from '@/components/install-app-button'

const navItems = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Timeline', href: '/timeline', icon: Calendar },
  { name: 'New Entry', href: '/entry/new', icon: PlusCircle, isSpecial: true },
  { name: 'Memories', href: '/memories', icon: Heart },
  { name: 'Friends', href: '/friends', icon: Users },
  { name: 'Gallery', href: '/gallery', icon: ImageIcon },
  { name: 'Map', href: '/map', icon: MapIcon },
  { name: 'Stats', href: '/stats', icon: Activity },
  { name: 'Saved', href: '/saved', icon: Bookmark },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile, streak, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="hidden lg:flex lg:flex-col fixed top-0 left-0 bottom-0 w-72 bg-card/50 backdrop-blur-xl border-r border-border z-40">
      {/* Logo */}
      <div className="p-6">
        <Link href="/feed" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
            📔
          </div>
          <span className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text tracking-tight">Journi</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          if (item.isSpecial) {
            return (
              <Link key={item.href} href={item.href} className="block my-6">
                <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 font-medium justify-start px-4">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Button>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              {item.name}
            </Link>
          )
        })}
        
        {/* Admin Dashboard Link */}
        {profile?.is_admin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              pathname.startsWith('/admin')
                ? 'bg-red-500/10 text-red-500 dark:text-red-400' 
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">🛡️</div>
            Admin Panel
          </Link>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 mt-auto">
        {profile && profile.current_streak && profile.current_streak > 0 ? (
          <div className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center gap-3">
            <span className="text-2xl animate-pulse">🔥</span>
            <div>
              <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{profile.current_streak} Day Streak!</div>
              <div className="text-xs text-muted-foreground">Keep it up!</div>
            </div>
          </div>
        ) : null}

        <Separator className="mb-4" />
        
        <div className="flex items-center gap-3 px-2 mb-4">
          <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:bg-secondary/50 p-1.5 rounded-xl transition-colors cursor-pointer">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(profile?.full_name || profile?.username || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name || 'Journaler'}</p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username || 'user'}</p>
            </div>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between px-2 gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Light"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Dark"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('amoled')}
              className={`p-1.5 rounded-md transition-colors ${theme === 'amoled' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="AMOLED"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        {/* App Install Button */}
        <div className="mb-4 px-2">
          <InstallAppButton />
        </div>
      </div>
    </div>
  )
}
