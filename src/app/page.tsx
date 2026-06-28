import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center animate-fade-in max-w-3xl mx-auto space-y-8">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-6xl shadow-2xl mb-8 border border-primary/20">
          📔
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
          Welcome to <span className="gradient-text">Journi</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Capture your moments, share your story, relive your memories. The modern digital journal for your everyday life.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/signup">
            <Button className="h-14 px-8 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-transform hover:scale-105 w-full sm:w-auto">
              Get Started for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="h-14 px-8 text-lg rounded-2xl border-border hover:bg-secondary/50 transition-transform hover:scale-105 w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
