import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { OfflineSyncProvider } from '@/components/offline-sync-provider'
import { AuthProvider } from '@/components/auth-provider'
import Script from 'next/script'
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
      </head>
      <body className={`min-h-screen bg-background text-foreground antialiased ${inter.variable} ${outfit.variable}`}>
        <Script id="sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
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
