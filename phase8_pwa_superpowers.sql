-- Phase 8: PWA Superpowers

-- 1. Add audio_url to journals
ALTER TABLE journals
ADD COLUMN IF NOT EXISTS audio_url text;

-- 2. Create the 'audio' bucket in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for 'audio' bucket

-- Allow public read access to audio
CREATE POLICY "Public Audio Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Allow authenticated users to upload audio
CREATE POLICY "Authenticated Users Can Upload Audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own audio
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio' AND 
  auth.uid() = owner
);
