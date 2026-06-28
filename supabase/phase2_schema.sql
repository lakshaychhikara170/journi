-- ============================================
-- Phase 2 Schema: Social, Reactions, Comments
-- ============================================
-- Run this in Supabase SQL Editor AFTER Phase 1 schema

-- 1. Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- 2. Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('love', 'fire', 'happy', 'clap', 'amazing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(journal_id, user_id, reaction_type)
);

-- 3. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accepted', 'reaction')),
  reference_id UUID,
  reference_table TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Saved/Bookmarked journals
CREATE TABLE IF NOT EXISTS saved_journals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, journal_id)
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_reactions_journal ON reactions(journal_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_journal ON comments(journal_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(receiver_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- RLS Policies
-- ============================================

-- Friendships RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own friendships." ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests." ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can update friendship status." ON friendships FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Users can delete their own friendships." ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Reactions RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone." ON reactions FOR SELECT USING (TRUE);
CREATE POLICY "Users can add reactions." ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions." ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone." ON comments FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can post comments." ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments." ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own notifications." ON notifications FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Anyone can create notifications." ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update their own notifications." ON notifications FOR UPDATE USING (auth.uid() = receiver_id);

-- Saved journals RLS
ALTER TABLE saved_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their saved journals." ON saved_journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save journals." ON saved_journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave journals." ON saved_journals FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Update journals RLS for friends visibility
-- ============================================
-- Drop old policy if exists
DROP POLICY IF EXISTS "Public journals are viewable by everyone." ON journals;
DROP POLICY IF EXISTS "Users can view their own journals." ON journals;

-- Unified read policy: own journals + public + friends' journals
CREATE POLICY "Users can view appropriate journals." ON journals FOR SELECT USING (
  auth.uid() = user_id
  OR visibility = 'public'
  OR (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_id)
        OR (addressee_id = auth.uid() AND requester_id = user_id)
      )
    )
  )
);
