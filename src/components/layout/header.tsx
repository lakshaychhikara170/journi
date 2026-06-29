'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { FriendRequestsMenu } from '@/components/layout/friend-requests-menu'
import { NotificationsMenu } from '@/components/layout/notifications-menu'
import { MobileMenuDrawer } from '@/components/layout/mobile-menu-drawer'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  const getPageTitle = () => {
    if (pathname === '/feed') return 'Your Feed'
    if (pathname === '/search') return 'Search'
    if (pathname === '/timeline') return 'Timeline'
    if (pathname === '/memories') return 'Memories'
    if (pathname === '/gallery') return 'Gallery'
    if (pathname === '/profile') return 'Profile'
    if (pathname.startsWith('/entry/new')) return 'New Entry'
    if (pathname.startsWith('/entry/')) return 'Journal Entry'
    return 'Journi'
  }

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-2 lg:hidden">
        <MobileMenuDrawer />
        <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] gradient-text tracking-tight ml-1">Journi</h1>
      </div>
      
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-heading)]">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search input - pill shaped with glass background */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[140px] sm:w-[200px] lg:w-[300px] h-9 pl-9 pr-3 rounded-full bg-secondary/60 backdrop-blur-sm border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200"
          />
        </div>
        <FriendRequestsMenu />
        <NotificationsMenu />
      </div>
    </header>
  )
}
