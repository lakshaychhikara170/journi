import { MoodType, ReactionType, VisibilityType } from '@/types';

export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#FFD93D' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#6C9BCF' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: '#FF6B6B' },
  { id: 'calm', emoji: '😌', label: 'Calm', color: '#95E1D3' },
  { id: 'angry', emoji: '😤', label: 'Angry', color: '#FF4757' },
  { id: 'loved', emoji: '🥰', label: 'Loved', color: '#FF9FF3' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#A29BFE' },
  { id: 'productive', emoji: '💪', label: 'Productive', color: '#00D2D3' },
  { id: 'creative', emoji: '🎨', label: 'Creative', color: '#FF9F43' },
];

export const REACTIONS: Record<ReactionType, { emoji: string; label: string }> = {
  love: { emoji: '❤️', label: 'Love' },
  fire: { emoji: '🔥', label: 'Fire' },
  happy: { emoji: '😊', label: 'Happy' },
  clap: { emoji: '👏', label: 'Clap' },
  amazing: { emoji: '💯', label: 'Amazing' },
};

export const VISIBILITY_OPTIONS = [
  { id: 'private', icon: '🔒', label: 'Private', description: 'Only visible to you' },
  { id: 'friends', icon: '👥', label: 'Friends', description: 'Visible to your friends' },
  { id: 'public', icon: '🌍', label: 'Public', description: 'Visible to everyone' },
];

export const ACHIEVEMENTS = [
  { id: 'first_entry', name: 'First Step', description: 'Create your first journal entry', icon: '✍️', threshold: 1 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day journaling streak', icon: '🔥', threshold: 7 },
  { id: 'streak_30', name: 'Month Master', description: '30-day journaling streak', icon: '⭐', threshold: 30 },
  { id: 'streak_100', name: 'Century Club', description: '100-day journaling streak', icon: '💎', threshold: 100 },
  { id: 'streak_365', name: 'Year Legend', description: '365-day journaling streak', icon: '👑', threshold: 365 },
  { id: 'photos_10', name: 'Shutterbug', description: 'Upload 10 photos', icon: '📸', threshold: 10 },
  { id: 'photos_100', name: 'Photo Master', description: 'Upload 100 photos', icon: '🖼️', threshold: 100 },
  { id: 'entries_50', name: 'Storyteller', description: 'Write 50 journal entries', icon: '📖', threshold: 50 },
];

export const TAG_SUGGESTIONS = [
  'travel', 'work', 'family', 'friends', 'food', 'fitness', 'music', 'reading',
  'coding', 'nature', 'art', 'photography', 'meditation', 'gratitude', 'adventure',
  'learning', 'cooking', 'gaming', 'movies', 'wellness', 'goals', 'reflection',
];

export const NAV_ITEMS = [
  { href: '/feed', label: 'Feed', icon: 'Home' },
  { href: '/timeline', label: 'Timeline', icon: 'Calendar' },
  { href: '/journal/new', label: 'New Entry', icon: 'PlusCircle' },
  { href: '/memories', label: 'Memories', icon: 'Heart' },
  { href: '/gallery', label: 'Gallery', icon: 'Image' },
] as const;
