import { NextRequest } from 'next/server'

// Default blocked countries for task system
export const DEFAULT_BLOCKED_COUNTRIES = ['IN', 'PK', 'BD'] // India, Pakistan, Bangladesh

// Get blocked countries from environment or use defaults
export function getBlockedCountries(): string[] {
  const envBlocked = process.env.BLOCKED_COUNTRIES
  if (envBlocked) {
    return envBlocked.split(',').map(c => c.trim().toUpperCase())
  }
  return DEFAULT_BLOCKED_COUNTRIES
}

// Country code mapping
export const COUNTRY_NAMES = {
  'IN': 'India',
  'PK': 'Pakistan', 
  'BD': 'Bangladesh'
}

/**
 * Get user's country code from IP address using multiple methods
 */
export async function getUserCountry(request: NextRequest): Promise<string | null> {
  try {
    // Development testing: Check for test country header
    if (process.env.NODE_ENV === 'development') {
      const testCountry = request.headers.get('x-test-country')
      if (testCountry) {
        console.log(`🧪 Development: Using test country: ${testCountry}`)
        return testCountry.toUpperCase()
      }
      
      // Check for development simulation via query parameter
      const url = new URL(request.url)
      const simulateCountry = url.searchParams.get('simulate_country')
      if (simulateCountry) {
        console.log(`🧪 Development: Simulating country: ${simulateCountry}`)
        return simulateCountry.toUpperCase()
      }
    }

    // Method 1: Check Cloudflare headers (if using Cloudflare)
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'XX') {
      console.log(`Country detected via Cloudflare: ${cfCountry}`)
      return cfCountry.toUpperCase()
    }

    // Method 2: Check Vercel headers (if deployed on Vercel)
    const vercelCountry = request.headers.get('x-vercel-ip-country')
    if (vercelCountry && vercelCountry !== 'XX') {
      console.log(`Country detected via Vercel: ${vercelCountry}`)
      return vercelCountry.toUpperCase()
    }

    // Method 3: Get IP and use free geolocation service
    const ip = getClientIP(request)
    console.log(`🔍 Detected IP: ${ip || 'none'}, isLocal: ${ip ? isLocalIP(ip) : 'N/A'}`)
    
    if (ip && !isLocalIP(ip)) {
      const country = await getCountryFromIP(ip)
      if (country) {
        console.log(`Country detected via IP lookup: ${country}`)
        return country.toUpperCase()
      }
    }

    // Method 4: Development fallback - try to get real IP using external service
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('🧪 Development mode: Attempting to get real public IP...')
        const realCountry = await getRealUserCountry()
        if (realCountry) {
          console.log(`🌍 Real country detected: ${realCountry}`)
          return realCountry.toUpperCase()
        }
      } catch (error) {
        console.log('Could not get real country in development:', error)
      }
    }

    console.log('Could not determine user country - allowing access')
    return null
  } catch (error) {
    console.error('Error detecting user country:', error)
    return null
  }
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: NextRequest): string | null {
  // Check various headers for IP address
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-vercel-forwarded-for'
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim()
      if (ip && !isLocalIP(ip)) {
        return ip
      }
    }
  }

  return null
}

/**
 * Check if IP is local/private
 */
function isLocalIP(ip: string): boolean {
  if (!ip) return true
  
  // Local/private IP ranges
  const localRanges = [
    /^127\./,           // 127.0.0.0/8
    /^10\./,            // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12
    /^192\.168\./,      // 192.168.0.0/16
    /^::1$/,            // IPv6 localhost
    /^fc00:/,           // IPv6 private
    /^fe80:/            // IPv6 link-local
  ]

  return localRanges.some(range => range.test(ip)) || ip === 'localhost'
}

/**
 * Get country from IP using free geolocation service
 */
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Using ipapi.co (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'User-Agent': 'MCNmart/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const country = await response.text()
      return country.trim().toUpperCase()
    }

    // Fallback to ip-api.com (free tier: 1000 requests/hour)
    const fallbackResponse = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      headers: {
        'User-Agent': 'MCNmart/1.0'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return data.countryCode?.toUpperCase() || null
    }

    return null
  } catch (error) {
    console.error('Error fetching country from IP:', error)
    return null
  }
}

/**
 * Get real user country in development by detecting actual public IP
 */
async function getRealUserCountry(): Promise<string | null> {
  try {
    // First get the real public IP
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000)
    })
    
    if (!ipResponse.ok) {
      return null
    }
    
    const ipData = await ipResponse.json()
    const publicIP = ipData.ip
    
    if (!publicIP || isLocalIP(publicIP)) {
      return null
    }
    
    console.log(`🌐 Real public IP detected: ${publicIP}`)
    
    // Now get country from this IP
    return await getCountryFromIP(publicIP)
  } catch (error) {
    console.error('Error getting real user country:', error)
    return null
  }
}

/**
 * Check if user's country is blocked for tasks
 */
export function isCountryBlocked(countryCode: string | null): boolean {
  if (!countryCode) return false
  const blockedCountries = getBlockedCountries()
  const isBlocked = blockedCountries.includes(countryCode.toUpperCase())
  console.log(`🔍 Checking if ${countryCode} is blocked. Blocked countries: [${blockedCountries.join(', ')}]. Result: ${isBlocked}`)
  return isBlocked
}

/**
 * Get blocked country name for display
 */
export function getBlockedCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode as keyof typeof COUNTRY_NAMES] || countryCode
}

/**
 * Check if request is from blocked country
 */
export async function isRequestFromBlockedCountry(request: NextRequest): Promise<{
  isBlocked: boolean
  country: string | null
  countryName?: string
}> {
  const country = await getUserCountry(request)
  const isBlocked = isCountryBlocked(country)
  
  return {
    isBlocked,
    country,
    countryName: country && isBlocked ? getBlockedCountryName(country) : undefined
  }
}

/**
 * Development/testing helper - simulate country for testing
 */
export function simulateCountry(request: NextRequest, testCountry?: string): string | null {
  // Only in development mode
  if (process.env.NODE_ENV === 'development' && testCountry) {
    console.log(`🧪 Simulating country: ${testCountry}`)
    return testCountry.toUpperCase()
  }
  return null
}
