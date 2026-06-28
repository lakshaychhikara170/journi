'use client'

import { useEffect, useMemo } from 'react'

interface StreakCelebrationProps {
  streak: number
  show: boolean
  onClose: () => void
}

const MILESTONES: Record<number, { emoji: string; text: string }> = {
  3: { emoji: '🔥', text: '3 Day Streak!' },
  7: { emoji: '⚡', text: 'Week Warrior!' },
  14: { emoji: '💪', text: 'Two Week Champion!' },
  30: { emoji: '🏆', text: 'Monthly Master!' },
  100: { emoji: '👑', text: 'Legendary Journaler!' },
}

const CONFETTI_COLORS = [
  '#a855f7', // purple
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
]

const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const

function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2.5 + Math.random() * 2,
    rotation: Math.random() * 360,
    rotationSpeed: 200 + Math.random() * 600,
    size: 6 + Math.random() * 8,
    drift: -30 + Math.random() * 60,
  }))
}

export function StreakCelebration({ streak, show, onClose }: StreakCelebrationProps) {
  const milestone = MILESTONES[streak]
  const confetti = useMemo(() => generateConfetti(50), [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [show, onClose])

  if (!show || !milestone) return null

  return (
    <>
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20vh) translateX(0px) rotate(0deg);
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rot-end));
            opacity: 0;
          }
        }

        @keyframes celebrationPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes emojiPop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes textSlideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @keyframes overlayFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .celebration-overlay {
          animation: overlayFadeIn 0.4s ease-out;
        }

        .celebration-emoji {
          animation: emojiPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }

        .celebration-text {
          animation: textSlideUp 0.5s ease-out 0.5s both;
        }

        .celebration-subtext {
          animation: textSlideUp 0.5s ease-out 0.7s both;
        }

        .celebration-button {
          animation: textSlideUp 0.5s ease-out 0.9s both;
        }

        .celebration-card {
          animation: celebrationPulse 2s ease-in-out infinite;
        }

        .shimmer-text {
          background: linear-gradient(
            90deg,
            #a855f7 0%,
            #ec4899 25%,
            #f59e0b 50%,
            #ec4899 75%,
            #a855f7 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .confetti-piece {
          position: absolute;
          top: -20px;
          animation: confettiFall var(--duration) cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay) both;
          pointer-events: none;
        }
      `}</style>

      <div className="celebration-overlay fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((piece) => {
            const style: React.CSSProperties & Record<string, string> = {
              left: `${piece.left}%`,
              '--delay': `${piece.delay}s`,
              '--duration': `${piece.duration}s`,
              '--drift': `${piece.drift}px`,
              '--rot-end': `${piece.rotationSpeed}deg`,
              backgroundColor: piece.color,
              width: piece.shape === 'strip' ? `${piece.size * 0.4}px` : `${piece.size}px`,
              height: piece.shape === 'strip' ? `${piece.size * 1.8}px` : `${piece.size}px`,
              borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? '2px' : '2px',
              transform: `rotate(${piece.rotation}deg)`,
            }

            return (
              <div
                key={piece.id}
                className="confetti-piece"
                style={style}
              />
            )
          })}
        </div>

        {/* Celebration Card */}
        <div className="celebration-card relative z-10 mx-4 max-w-sm w-full rounded-3xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/20 p-8 text-center">
          {/* Glow ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-amber-500/20 blur-xl -z-10" />

          {/* Emoji */}
          <div className="celebration-emoji text-7xl mb-4">
            {milestone.emoji}
          </div>

          {/* Milestone Text */}
          <h2 className="celebration-text text-3xl font-bold font-[family-name:var(--font-heading)] shimmer-text mb-2">
            {milestone.text}
          </h2>

          {/* Subtext */}
          <p className="celebration-subtext text-muted-foreground text-sm mb-6">
            {streak >= 100
              ? "You've achieved legendary status! Absolutely incredible!"
              : streak >= 30
              ? "A full month of journaling — you're unstoppable!"
              : streak >= 14
              ? 'Two weeks strong! Your consistency is inspiring.'
              : streak >= 7
              ? "A whole week! You're building an amazing habit."
              : "Great start! Keep the momentum going!"}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className="celebration-button inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Keep Going! 🚀
          </button>
        </div>
      </div>
    </>
  )
}
