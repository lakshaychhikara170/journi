'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile, Streak } from '@/types'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile, streak, isLoading, reset } = useAuthStore()

  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  return { user, profile, streak, isLoading, signOut }
}
