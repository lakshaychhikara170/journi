import { createClient } from '@/lib/supabase/client'
import { isToday, isYesterday, parseISO, format, differenceInDays } from 'date-fns'

export const BADGE_DEFINITIONS = {
  first_entry: { id: 'first_entry', name: 'First Words', description: 'Wrote your very first journal entry.', icon: '🌱' },
  streak_3: { id: 'streak_3', name: 'On a Roll', description: 'Maintained a 3-day journaling streak.', icon: '🔥' },
  streak_7: { id: 'streak_7', name: 'Habit Builder', description: 'Maintained a 7-day journaling streak.', icon: '📅' },
  streak_30: { id: 'streak_30', name: 'Journaling Master', description: 'Maintained a 30-day journaling streak.', icon: '👑' },
  location_1: { id: 'location_1', name: 'Explorer', description: 'Logged an entry with a location.', icon: '📍' },
  photo_1: { id: 'photo_1', name: 'Memory Maker', description: 'Uploaded your first photo.', icon: '📸' }
}

export type BadgeId = keyof typeof BADGE_DEFINITIONS;

export async function processGamification(userId: string, entryDetails: { hasLocation: boolean; hasPhoto: boolean }) {
  const supabase = createClient()
  
  // 1. Fetch current profile stats
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_journal_date, earned_badges, profile_theme')
    .eq('id', userId)
    .single()
    
  if (error || !profile) {
    console.error('Gamification: Failed to load profile stats. Did you run the phase5_gamification.sql script?', error)
    return { newBadges: [] }
  }

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  
  let newStreak = profile.current_streak || 0
  let newLongest = profile.longest_streak || 0
  let currentBadges: string[] = profile.earned_badges || []
  let newBadgesUnlocked: string[] = []

  // 2. Calculate new streak
  if (profile.last_journal_date) {
    if (profile.last_journal_date === todayStr) {
      // Already journaled today, no streak change
    } else {
      // Create local midnight dates to avoid any timezone shifts
      const lastDate = new Date(`${profile.last_journal_date}T00:00:00`)
      const currentDate = new Date(`${todayStr}T00:00:00`)
      
      if (differenceInDays(currentDate, lastDate) === 1) {
        // Consecutive day!
        newStreak += 1
      } else {
        // Streak broken :(
        newStreak = 1
      }
    }
  } else {
    // First entry ever
    newStreak = 1
  }

  if (newStreak > newLongest) {
    newLongest = newStreak
  }

  // Helper to add badges
  const checkBadge = (id: BadgeId, condition: boolean) => {
    if (condition && !currentBadges.includes(id)) {
      currentBadges.push(id)
      newBadgesUnlocked.push(id)
    }
  }

  // 3. Evaluate Badges
  checkBadge('first_entry', true)
  checkBadge('streak_3', newStreak >= 3)
  checkBadge('streak_7', newStreak >= 7)
  checkBadge('streak_30', newStreak >= 30)
  checkBadge('location_1', entryDetails.hasLocation)
  checkBadge('photo_1', entryDetails.hasPhoto)

  // 4. Save updates to profile
  const updateData = {
    current_streak: newStreak,
    longest_streak: newLongest,
    last_journal_date: todayStr, // Save as local YYYY-MM-DD
    earned_badges: currentBadges
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (updateError) {
    console.error('Gamification: Failed to update stats', updateError)
  }

  return { 
    newBadges: newBadgesUnlocked.map(id => BADGE_DEFINITIONS[id as BadgeId]),
    currentStreak: newStreak,
    longestStreak: newLongest
  }
}
