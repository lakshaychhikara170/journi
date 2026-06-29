import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { OfflineSyncProvider } from '@/components/offline-sync-provider'
import { AuthProvider } from '@/components/auth-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Journi — Your Digital Journal',
  description: 'Capture your moments, share your story, relive your memories. A beautiful social journaling platform.',
  keywords: ['journal', 'diary', 'memories', 'photos', 'social', 'journaling'],
  manifest: '/manifest.json',
  themeColor: '#09090b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Journi',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
        `}} />
      </head>
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.variable} ${outfit.variable}`}>

        <ThemeProvider>
          <AuthProvider>
            <OfflineSyncProvider>
              {children}
              <Toaster richColors position="top-center" />
            </OfflineSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
