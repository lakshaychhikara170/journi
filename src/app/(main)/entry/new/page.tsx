'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, PenTool, Mic } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichEditor } from '@/components/journal/rich-editor'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { sounds } from '@/lib/sounds'
import { MoodPicker } from '@/components/journal/mood-picker'
import { VisibilitySelector } from '@/components/journal/visibility-selector'
import { PhotoUpload } from '@/components/journal/photo-upload'
import { AudioRecorder } from '@/components/journal/audio-recorder'
import { DictationButton } from '@/components/journal/dictation-button'
import { LocationPicker } from '@/components/journal/location-picker'
import { useJournalStore } from '@/stores/journal-store'
import { useAuthStore } from '@/stores/auth-store'
import type { MoodType, VisibilityType } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { saveOfflineJournal } from '@/lib/offline-sync'

import { processGamification } from '@/lib/gamification'

type EntryMode = 'select' | 'writing' | 'voice'

export default function NewEntryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const { draft, setDraft, resetDraft } = useJournalStore()
  
  const [mode, setMode] = useState<EntryMode>('select')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [liveTranscript, setLiveTranscript] = useState('')

  const handleRecordingComplete = (blob: Blob | null) => {
    setAudioBlob(blob)
    if (blob && liveTranscript.trim()) {
      const currentContent = draft.content === '<p></p>' ? '' : draft.content
      setDraft({ content: `${currentContent}<p><em>🗣️ ${liveTranscript.trim()}</em></p>` })
      setLiveTranscript('')
    } else if (!blob) {
      setLiveTranscript('')
    }
  }

  const handleDictation = (text: string) => {
    if (!text) return
    const currentContent = draft.content === '<p></p>' ? '' : draft.content
    // Append the transcribed text seamlessly
    setDraft({ content: `${currentContent} ${text}`.trim() })
  }

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true)
    try {
      const res = await fetch('/api/generate-prompt')
      if (!res.ok) throw new Error('Failed to generate prompt')
      const data = await res.json()
      if (data.prompt) {
        setDraft({ title: 'Prompt: ' + data.prompt.slice(0, 50) + '...', content: `<blockquote>${data.prompt}</blockquote><p></p>` })
      }
    } catch (error) {
      toast.error('Could not generate prompt right now.')
      console.error(error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in to post')
      return
    }

    if (!draft.title.trim() && !draft.content.trim() && !audioBlob) {
      toast.error('Your journal cannot be completely empty')
      return
    }

    setIsSubmitting(true)

    // Offline Mode Support
    if (!navigator.onLine) {
      try {
        await saveOfflineJournal({
          user_id: user.id,
          title: draft.title || (mode === 'voice' ? 'Voice Memo' : 'Untitled Entry'),
          content: draft.content,
          mood: draft.mood,
          location: draft.location,
          photos: draft.photos || [],
          visibility: draft.visibility,
          audioBlob: audioBlob
        })
        toast.success('Saved offline! Will sync when reconnected.', { icon: '✈️' })
        sounds.success()
        resetDraft()
        router.push('/feed')
        return
      } catch (e) {
        console.error('Failed to save offline:', e)
        toast.error('Failed to save offline entry.')
        setIsSubmitting(false)
        return
      }
    }

    try {
      let audioUrl = null

      // Upload audio if present
      if (audioBlob) {
        const fileExt = 'webm'
        const fileName = `${user.id}/${uuidv4()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' })

        if (uploadError) {
          console.error('Audio upload failed:', uploadError)
          toast.error('Failed to upload audio, saving without it.')
        } else {
          const { data } = supabase.storage.from('audio').getPublicUrl(fileName)
          audioUrl = data.publicUrl
        }
      }

      // 1. Insert the journal entry
      const { data: insertedJournal, error: journalError } = await supabase
        .from('journals')
        .insert({
          user_id: user.id,
          title: draft.title || (mode === 'voice' ? 'Voice Memo' : 'Untitled Entry'),
          content: draft.content,
          mood: draft.mood,
          location: draft.location,
          photos: draft.photos || [], // keep legacy array just in case
          visibility: draft.visibility,
          audio_url: audioUrl as any,
        })
        .select('id')
        .single()

      if (journalError) throw journalError

      // 2. Insert photos into journal_photos table
      if (draft.photos && draft.photos.length > 0 && insertedJournal) {
        const photoRecords = draft.photos.map((url) => ({
          journal_id: insertedJournal.id,
          photo_url: url,
        }))
        
        const { error: photosError } = await supabase
          .from('journal_photos')
          .insert(photoRecords)
          
        if (photosError) console.error('Failed to save photos to journal_photos table:', photosError)
      }

      // 3. Process Gamification
      const hasLocation = !!draft.location && typeof draft.location === 'object' && !!draft.location.name;
      const hasPhoto = !!(draft.photos && draft.photos.length > 0);
      const gamificationResult = await processGamification(user.id, { hasLocation, hasPhoto });
      
      // Instantly update the local profile streak
      if (gamificationResult && useAuthStore.getState().profile) {
        const currentProfile = useAuthStore.getState().profile!;
        const currentBadges = currentProfile.earned_badges || [];
        const newBadgeIds = gamificationResult.newBadges.map(b => b.id);
        
        useAuthStore.getState().setProfile({
          ...currentProfile,
          current_streak: gamificationResult.currentStreak,
          longest_streak: gamificationResult.longestStreak,
          earned_badges: Array.from(new Set([...currentBadges, ...newBadgeIds]))
        })
      }
      
      toast.success('Journal entry saved successfully!')
      sounds.success()
      
      // Notify about badges
      if (gamificationResult?.newBadges?.length) {
        gamificationResult.newBadges.forEach((badge, index) => {
          setTimeout(() => {
            useAuthStore.getState().pushBadge(badge)
            sounds.success() // Or a special badge sound
          }, 1000 * index)
        })
      }

      resetDraft()
      router.push('/feed')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Initial Selection Screen
  if (mode === 'select') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12 pt-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold font-[family-name:var(--font-heading)]">New Entry</h1>
          <p className="text-muted-foreground">How would you like to capture your thoughts today?</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <button 
            onClick={() => setMode('writing')}
            className="group flex flex-col items-center justify-center gap-4 p-8 bg-card border rounded-3xl hover:bg-primary/5 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-heading)]">Actually Writing</h3>
              <p className="text-sm text-muted-foreground mt-2">Type out your thoughts or dictate them.</p>
            </div>
          </button>
          
          <button 
            onClick={() => setMode('voice')}
            className="group flex flex-col items-center justify-center gap-4 p-8 bg-card border rounded-3xl hover:bg-primary/5 hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-heading)]">Voice Memo</h3>
              <p className="text-sm text-muted-foreground mt-2">Record a raw audio journal.</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Render Writing or Voice Panel
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setMode('select')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
            {mode === 'writing' ? 'How was your day?' : 'Record a Memo'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'writing' ? 'Capture your thoughts and moments.' : 'Speak your mind freely.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ title: e.target.value })}
            placeholder={mode === 'voice' ? "Name this memo (optional)..." : "Give your entry a title..."}
            className="text-2xl font-bold font-[family-name:var(--font-heading)] border-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Content specific to Mode */}
        {mode === 'writing' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center px-1 gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Entry</h3>
              <div className="flex items-center gap-2">
                <DictationButton onTranscription={handleDictation} disabled={isSubmitting} />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generatePrompt}
                  disabled={isGeneratingPrompt || isSubmitting}
                  className="rounded-full h-8 px-3 text-xs font-medium gap-1.5"
                >
                  {isGeneratingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>✨</span>}
                  {isGeneratingPrompt ? 'Thinking...' : 'AI Prompt'}
                </Button>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl overflow-hidden p-2">
              <RichEditor
                content={draft.content}
                onChange={(content) => setDraft({ content })}
                placeholder="Write your heart out..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Audio</h3>
            <div className="bg-card/50 backdrop-blur-sm border rounded-3xl p-6 shadow-sm">
              <AudioRecorder 
                onRecordingComplete={handleRecordingComplete} 
                onTranscription={setLiveTranscript}
                disabled={isSubmitting} 
              />
              {liveTranscript && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl animate-fade-in text-sm text-foreground/80 italic shadow-inner">
                  <p className="font-semibold text-primary mb-1 not-italic text-xs uppercase tracking-wider">Live Transcript</p>
                  "{liveTranscript}..."
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8 pt-6 border-t border-border/50">
          {/* Photo Upload */}
          <PhotoUpload 
            photos={draft.photos || []}
            onChange={(photos) => setDraft({ photos })}
          />

          {/* Mood Picker */}
          <MoodPicker 
            value={draft.mood} 
            onChange={(mood) => setDraft({ mood })} 
          />

          {/* Location Picker */}
          <LocationPicker
            value={draft.location}
            onChange={(location) => setDraft({ location })}
          />

          {/* Visibility */}
          <VisibilitySelector 
            value={draft.visibility} 
            onChange={(visibility) => setDraft({ visibility })} 
          />
        </div>

        <div className="pt-6 flex justify-end gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="rounded-xl font-medium"
            onClick={() => setMode('select')}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button 
            type="submit" 
            className="rounded-xl px-8 font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            disabled={isSubmitting || (!draft.title.trim() && !draft.content.trim() && !audioBlob)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Entry
          </Button>
        </div>
      </form>
    </div>
  )
}
