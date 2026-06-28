'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Plus, Heart, User, Search } from 'lucide-react'

const navItems = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'New', href: '/entry/new', icon: Plus, isSpecial: true },
  { name: 'Memories', href: '/memories', icon: Heart },
  { name: 'Profile', href: '/profile', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  // Don't show nav on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')) {
    return null
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border -z-10" />
      <div className="flex items-center justify-around px-2 py-2 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          if (item.isSpecial) {
            return (
              <Link key={item.href} href={item.href} className="relative -top-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform duration-150 border-4 border-background">
                  <item.icon className="w-6 h-6" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full gap-0.5 active:scale-90 transition-all duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`relative p-1.5 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary/12 scale-105'
                  : 'hover:bg-muted/50'
              }`}>
                <item.icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                  }`}
                  {...(isActive ? { fill: 'currentColor', fillOpacity: 0.15 } : {})}
                />
              </div>
              <span className={`text-[10px] tracking-wide transition-all duration-300 ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {item.name}
              </span>
              {/* Active indicator dot */}
              <div className={`h-1 w-1 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-primary scale-100 opacity-100'
                  : 'bg-transparent scale-0 opacity-0'
              }`} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
