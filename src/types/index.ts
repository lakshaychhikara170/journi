// TypeScript interfaces for the Journi platform

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  is_banned?: boolean;
  current_streak?: number;
  longest_streak?: number;
  last_journal_date?: string | null;
  earned_badges?: string[];
  profile_theme?: string;
  default_visibility?: 'private' | 'friends' | 'public';
  daily_reminder?: boolean;
  email_updates?: boolean;
  friend_activity?: boolean;
}

export interface Journal {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  visibility: 'private' | 'friends' | 'public';
  location: { name: string; lat?: number; lng?: number } | null;
  weather: { temp?: number; condition?: string; icon?: string } | null;
  journal_date: string;
  is_draft: boolean;
  likes_count: number;
  comments_count: number;
  audio_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  profiles?: Profile;
  journal_photos?: JournalPhoto[];
}

export interface JournalPhoto {
  id: string;
  journal_id: string;
  user_id: string;
  photo_url: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  journal_id: string;
  reaction_type: string;
  created_at: string;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  journal_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  receiver_id: string;
  sender_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'friend_request' | 'friend_accepted' | 'reaction' | 'streak_milestone' | 'memory' | 'reminder';
  reference_id: string | null;
  reference_table: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_entry_date: string | null;
  updated_at: string;
}

export interface SavedJournal {
  user_id: string;
  journal_id: string;
  created_at: string;
}

export type MoodType = 'happy' | 'sad' | 'excited' | 'calm' | 'angry' | 'love' | 'tired' | 'productive' | 'grateful' | 'creative';
export type VisibilityType = 'private' | 'friends' | 'public';
export type ReactionType = 'love' | 'fire' | 'happy' | 'clap' | 'amazing';
export type ThemeType = 'light' | 'dark' | 'amoled';
