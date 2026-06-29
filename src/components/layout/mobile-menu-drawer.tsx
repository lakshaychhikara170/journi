'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Home, Calendar, Heart, Image as ImageIcon, Users, Bookmark, Search, Activity, Map as MapIcon, PlusCircle, Settings, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/components/theme-provider'
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

export function MobileMenuDrawer() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card/95 backdrop-blur-xl border-r border-border">
        <SheetHeader className="p-6 border-b border-border/50 text-left">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm shadow-md">
              📔
            </div>
            <span className="text-xl font-bold font-[family-name:var(--font-heading)] gradient-text tracking-tight">Journi Menu</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            if (item.isSpecial) {
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block my-4">
                  <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 font-medium justify-start px-4">
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
                onClick={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                pathname.startsWith('/admin')
                  ? 'bg-red-500/10 text-red-500' 
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center">🛡️</div>
              Admin Panel
            </Link>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-border/50 bg-background/50">
          <div className="mb-4">
            <InstallAppButton />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('amoled')}
                className={`p-1.5 rounded-md transition-colors ${theme === 'amoled' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
            
            <Link href="/settings" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
