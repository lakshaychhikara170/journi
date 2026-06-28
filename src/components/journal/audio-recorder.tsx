'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Play, Pause, Trash2, MicOff } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
  onTranscription?: (text: string) => void;
  disabled?: boolean;
}

// Add TypeScript types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AudioRecorder({ onRecordingComplete, onTranscription, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize SpeechRecognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      let finalTranscript = ''
      
      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
            if (onTranscription) {
              onTranscription(finalTranscript.trim())
            }
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        // If we want to show interim results, we could pass (finalTranscript + interimTranscript)
        // But for a stable editor, passing only final results per pause is usually better.
        // We'll just pass the final ones to avoid the editor cursor jumping around constantly.
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }
      
      recognitionRef.current = recognition
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioURL) URL.revokeObjectURL(audioURL)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }, [audioURL, onTranscription])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        onRecordingComplete(audioBlob)
        stream.getTracks().forEach(track => track.stop()) // release microphone
        
        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch (e) {}
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch (e) {}
      }
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied:", err)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const deleteRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioURL(null)
    setRecordingTime(0)
    onRecordingComplete(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (audioURL) {
    return (
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl border">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 shrink-0 bg-background"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 pl-0.5 text-primary" />}
        </Button>
        <div className="flex-1">
          <audio 
            ref={audioRef} 
            src={audioURL} 
            onEnded={() => setIsPlaying(false)} 
            className="hidden" 
          />
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-300 ${isPlaying ? 'w-full' : 'w-0'}`} style={{ transitionDuration: `${recordingTime}s`, transitionTimingFunction: 'linear' }} />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums min-w-[3rem]">
          {formatTime(recordingTime)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full text-destructive hover:bg-destructive/10 shrink-0"
          onClick={deleteRecording}
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <div className="flex items-center gap-3 p-2 pr-4 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse-slow">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="rounded-full w-10 h-10 shrink-0 shadow-lg shadow-red-500/20"
            onClick={stopRecording}
          >
            <Square className="w-4 h-4 fill-current" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500 tabular-nums">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="rounded-full gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20"
          onClick={startRecording}
          disabled={disabled}
        >
          <Mic className="w-4 h-4" />
          Add Voice Memo
        </Button>
      )}
    </div>
  )
}
