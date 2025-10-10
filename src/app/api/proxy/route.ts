import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL to prevent SSRF attacks
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Only allow HTTPS URLs for security
    if (targetUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
    }

    // Whitelist allowed domains for security
    const allowedDomains = [
      'blog.hubspot.com',
      'www.shopify.com',
      'blog.hootsuite.com',
      'neilpatel.com',
      'contentmarketinginstitute.com',
      'blog.marketo.com',
      'blog.salesforce.com',
      'www.salesforce.com',
      'blog.linkedin.com',
      'www.linkedin.com',
      'blog.google.com',
      'developers.google.com',
      'medium.com',
      'www.medium.com'
    ]

    if (!allowedDomains.includes(targetUrl.hostname)) {
      return NextResponse.json({ 
        error: 'Domain not allowed. Only whitelisted domains are supported for security reasons.' 
      }, { status: 403 })
    }

    console.log(`Proxying request to: ${url}`)

    // Fetch the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch content: ${response.status} ${response.statusText}` 
      }, { status: response.status })
    }

    const html = await response.text()

    // Inject tracking script and modify the HTML
    const modifiedHtml = injectTrackingScript(html, url)

    // Return the HTML with proper headers
    return new NextResponse(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Frame-Options': 'SAMEORIGIN', // Allow framing from same origin
        'Content-Security-Policy': "frame-ancestors 'self'", // Modern alternative to X-Frame-Options
      },
    })

  } catch (error) {
    console.error('Proxy error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error while proxying content' 
    }, { status: 500 })
  }
}

function injectTrackingScript(html: string, originalUrl: string): string {
  // Create tracking script that will communicate with parent window
  // This script runs in the browser, not on the server
  const trackingScript = `
    <script>
      (function() {
        // Ensure we're running in a browser environment
        if (typeof window === 'undefined') {
          console.warn('MCNmart tracking script: window is not available');
          return;
        }
        
        let scrollPercentage = 0;
        let mouseMovements = 0;
        let timeSpent = 0;
        let startTime = Date.now();
        
        // Track scroll percentage
        function updateScrollPercentage() {
          try {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            scrollPercentage = Math.round((scrollTop / scrollHeight) * 100) || 0;
            
            // Send data to parent
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({
                type: 'TRACKING_UPDATE',
                data: {
                  scrollPercentage: scrollPercentage,
                  mouseMovements: mouseMovements,
                  timeSpent: Math.floor((Date.now() - startTime) / 1000),
                  url: '${originalUrl}'
                }
              }, '*');
            }
          } catch (error) {
            console.error('MCNmart tracking error:', error);
          }
        }
        
        // Track mouse movements
        function trackMouseMovement() {
          mouseMovements++;
          if (mouseMovements % 10 === 0) { // Update every 10 movements to avoid spam
            updateScrollPercentage();
          }
        }
        
        // Set up event listeners with error handling
        try {
          window.addEventListener('scroll', updateScrollPercentage, { passive: true });
          document.addEventListener('mousemove', trackMouseMovement, { passive: true });
          
          // Send initial data
          setTimeout(() => {
            updateScrollPercentage();
          }, 1000);
          
          // Send periodic updates
          setInterval(() => {
            updateScrollPercentage();
          }, 2000);
          
          // Send final data when page is about to unload
          window.addEventListener('beforeunload', () => {
            updateScrollPercentage();
          });
          
          console.log('MCNmart tracking script loaded for:', '${originalUrl}');
        } catch (error) {
          console.error('MCNmart tracking initialization error:', error);
        }
      })();
    </script>
  `;

  // Inject the script before closing body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', trackingScript + '</body>');
  } else {
    // If no body tag found, append to end
    return html + trackingScript;
  }
}
