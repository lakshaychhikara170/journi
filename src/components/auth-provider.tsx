'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile, Streak } from '@/types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { setUser, setProfile, setStreak, setLoading, reset } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const authUser = session?.user

        if (authUser && mounted) {
          setUser(authUser)
          
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
            
          let currentProfile = profileData
          if (!currentProfile) {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                username: authUser.user_metadata?.username || `user_${authUser.id.substring(0,8)}`,
                full_name: authUser.user_metadata?.full_name || 'Journaler'
              })
              .select()
              .single()
            currentProfile = newProfile
          }
          if (currentProfile && mounted) setProfile(currentProfile as Profile)

        } else if (!authUser && mounted && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
          reset()
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profileData && mounted) setProfile(profileData as Profile)
        } else if (event === 'SIGNED_OUT') {
          reset()
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
