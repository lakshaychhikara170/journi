import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journi — Your Digital Journal',
  description: 'Capture your life, one day at a time.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-4xl">
              📔
            </div>
          </div>
          <h1 className="text-5xl font-bold font-[family-name:var(--font-heading)] mb-4 text-center">
            Journi
          </h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Capture your moments, share your story, relive your memories.
          </p>
          <div className="mt-12 flex gap-6 text-white/60">
            <div className="text-center">
              <div className="text-3xl mb-1">📸</div>
              <div className="text-sm">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">✍️</div>
              <div className="text-sm">Journal</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-sm">Streaks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">💭</div>
              <div className="text-sm">Memories</div>
            </div>
          </div>
        </div>
        {/* Floating decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  )
}
