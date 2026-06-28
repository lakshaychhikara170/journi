'use client'

// Base64 encoded tiny 8-bit style sound effects (approx 200 bytes each)
const SOUNDS = {
  // A short high-pitched 'pop' for likes/reactions
  pop: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  // A satisfying 'chime' for saves
  success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  // A soft 'whoosh'
  whoosh: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
}

class SoundManager {
  private play(base64Data: string, volume = 0.5) {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio(base64Data)
        audio.volume = volume
        audio.play().catch(e => {
          console.debug('Audio play prevented:', e)
        })
      } catch (e) {
        console.debug('Audio failed to play:', e)
      }
    }
  }

  // Note: Using real synthesised web audio is much better for zero-asset sounds
  playTone(frequency: number, type: OscillatorType = 'sine', duration = 0.1) {
    if (typeof window === 'undefined') return
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = type
      osc.frequency.setValueAtTime(frequency, ctx.currentTime)
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (e) {
      console.debug('Web Audio API failed', e)
    }
  }

  pop() { this.playTone(600, 'sine', 0.1) } // High pop
  success() { this.playTone(800, 'triangle', 0.2); setTimeout(() => this.playTone(1200, 'triangle', 0.3), 100) } // Chime up
  whoosh() { this.playTone(200, 'sine', 0.3) } // Low hum
}

export const sounds = new SoundManager()
