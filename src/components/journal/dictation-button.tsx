'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DictationButtonProps {
  onTranscription: (text: string) => void
  disabled?: boolean
}

export function DictationButton({ onTranscription, disabled }: DictationButtonProps) {
  const [isDictating, setIsDictating] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
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
            onTranscription(finalTranscript.trim())
            finalTranscript = '' // Reset so we don't duplicate on next final chunk
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          setIsDictating(false)
        }
      }

      recognition.onend = () => {
        setIsDictating(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }, [onTranscription])

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      toast.error('Your browser does not support speech recognition.')
      return
    }

    if (isDictating) {
      try { recognitionRef.current.stop() } catch (e) {}
      setIsDictating(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsDictating(true)
        toast.success('Dictation started. Start speaking!')
      } catch (err) {
        console.error(err)
        toast.error('Could not start dictation. Check microphone permissions.')
      }
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggleDictation}
      disabled={disabled}
      className={`rounded-full h-8 px-3 text-xs font-medium gap-1.5 transition-colors ${
        isDictating ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border border-red-500/20 animate-pulse' : ''
      }`}
    >
      {isDictating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
      {isDictating ? 'Listening...' : 'Dictate'}
    </Button>
  )
}
