-- Phase 7: Preferences and Notifications

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS default_visibility text DEFAULT 'private',
ADD COLUMN IF NOT EXISTS daily_reminder boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS friend_activity boolean DEFAULT true;

-- Ensure default_visibility only accepts valid enum-like values
ALTER TABLE profiles
ADD CONSTRAINT check_visibility 
CHECK (default_visibility IN ('private', 'friends', 'public'));
