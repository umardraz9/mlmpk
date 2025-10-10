import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CartProvider } from '@/contexts/CartContext'
import { Providers } from '@/components/providers/session-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

const poppins = Poppins({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

// PWA and Mobile-optimized metadata
export const metadata: Metadata = {
  title: {
    default: 'MCNmart.com - Pakistan\'s Premier Social Sales Platform',
    template: '%s | MCNmart.com'
  },
  description: 'Join Pakistan\'s leading social sales platform. Earn PKR 3,000 with just PKR 1,000 partnership enrollment. Complete tasks, build your team, and grow your income.',
  keywords: [
    'Social Sales Pakistan',
    'Partnership Program',
    'Earn Money Online',
    'Home Based Business',
    'Pakistani Business',
    'Task Completion',
    'Team Building',
    'E-commerce Pakistan'
  ],
  authors: [{ name: 'MCNmart.com Team' }],
  creator: 'MCNmart.com',
  publisher: 'MCNmart.com',
  category: 'Business',
  classification: 'Business Platform',
  
  // Metadata base URL
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://mcnmart.com',
    siteName: 'MCNmart.com',
    title: 'MCNmart.com - Pakistan\'s Premier Social Sales Platform',
    description: 'Join Pakistan\'s leading social sales platform. Earn PKR 3,000 with just PKR 1,000 partnership enrollment.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MCNmart.com Platform'
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'MCNmart.com - Pakistan\'s Premier Social Sales Platform',
    description: 'Join Pakistan\'s leading social sales platform. Earn PKR 3,000 with just PKR 1,000 partnership enrollment.',
    images: ['/images/twitter-image.png'],
    creator: '@mcnmart'
  },
  
  // PWA
  manifest: '/manifest.json',
  
  // Icons
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#059669' }
    ]
  },
  
  // App-specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MCNmart.com',
    startupImage: [
      {
        url: '/icons/splash-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/icons/splash-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/icons/splash-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)'
      }
    ]
  },
  
  // Additional meta
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#059669',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#059669'
  }
}

// Mobile-optimized viewport
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#047857' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//api.mlmpak.com" />
        <link rel="dns-prefetch" href="//cdn.mlmpak.com" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" type="image/png" />
        <link rel="modulepreload" href="/_next/static/chunks/main.js" />
        
        {/* Remove unused font preload to fix performance warning */}
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for immediate rendering */
            html, body { margin: 0; padding: 0; }
            
            /* Prevent layout shift */
            * {
              box-sizing: border-box;
            }
            
            /* Loading spinner */
            .loading-spinner { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background: #f9fafb;
            }
            .loading-spinner::after {
              content: '';
              width: 32px;
              height: 32px;
              border: 3px solid #e5e7eb;
              border-top: 3px solid #059669;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            /* Smooth scroll behavior */
            html {
              scroll-behavior: smooth;
            }
            
            /* Optimize rendering */
            body {
              font-display: swap;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            /* Mobile-specific optimizations */
            @media (max-width: 768px) {
              body {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-size-adjust: none;
                -webkit-text-size-adjust: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
              }
              
              * {
                -webkit-overflow-scrolling: touch;
              }
              
              input, textarea, select {
                font-size: 16px; /* Prevent zoom on iOS */
              }
            }
            
            /* Safe area support */
            body {
              padding-top: env(safe-area-inset-top);
              padding-bottom: env(safe-area-inset-bottom);
              padding-left: env(safe-area-inset-left);
              padding-right: env(safe-area-inset-right);
            }
          `
        }} />
      </head>
      
      <body className={`${inter.variable} ${poppins.variable} font-sans h-full bg-gray-50 overflow-x-hidden`}>
        {/* Loading fallback */}
        <noscript>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f9fafb',
            fontFamily: 'system-ui, sans-serif'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#059669', marginBottom: '16px' }}>Partnership Program</h1>
              <p style={{ color: '#6b7280' }}>JavaScript is required to run this application.</p>
            </div>
          </div>
        </noscript>
        
        {/* Main app content with providers */}
        <Providers>
          <ThemeProvider>
            <CartProvider>
              <div id="app-root" className="min-h-full">
                {children}
              </div>
            </CartProvider>
          </ThemeProvider>
        </Providers>
        
        {/* Offline indicator */}
        <div 
          id="offline-indicator" 
          className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm transform -translate-y-full transition-transform duration-300 z-50"
          style={{ display: 'none' }}
        >
          You are currently offline. Some features may not be available.
        </div>
        
        {/* Update available indicator */}
        <div 
          id="update-indicator" 
          className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white rounded-lg p-3 text-sm transform translate-y-full transition-transform duration-300 z-50 md:left-auto md:right-4 md:max-w-sm"
          style={{ display: 'none' }}
        >
          <div className="flex items-center justify-between">
            <span>New version available!</span>
            <button id="update-button" className="bg-white text-blue-500 px-3 py-1 rounded text-xs font-medium">
              Update
            </button>
          </div>
        </div>
        
        {/* Client-side scripts */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              // Service Worker: constrain scope to /tasks and proactively unregister elsewhere
              if ('serviceWorker' in navigator) {
                const isTasksPage = window.location.pathname.startsWith('/tasks');

                // Proactively unregister any SW not scoped to /tasks (runs ASAP)
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => {
                    try {
                      const scopePath = new URL(registration.scope).pathname;
                      if (!scopePath.startsWith('/tasks')) {
                        registration.unregister();
                      }
                    } catch {}
                  });
                });

                // Only register on tasks pages, with explicit scope
                window.addEventListener('load', function() {
                  if (isTasksPage) {
                    navigator.serviceWorker.register('/sw-no-css-cache.js', { scope: '/tasks' })
                      .then(function(registration) {
                        // Periodic update checks
                        setInterval(() => { try { registration.update(); } catch {} }, 30 * 60 * 1000);
                      })
                      .catch(function(err) {
                        console.log('ServiceWorker registration failed:', err);
                      });
                  }
                });
              }

              // Network status handling without DOM attributes to avoid hydration mismatch
              function handleNetworkChange() {
                if (typeof window !== 'undefined') {
                  console.log('Network status:', navigator.onLine ? 'online' : 'offline');
                }
              }
              window.addEventListener('online', handleNetworkChange);
              window.addEventListener('offline', handleNetworkChange);
            }
          `
        }} />
      </body>
    </html>
  )
}
