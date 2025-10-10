import { NextRequest, NextResponse } from 'next/server'
import { isRequestFromBlockedCountry } from './geolocation'

/**
 * Middleware to check if user's country is blocked for task system
 */
export async function checkTaskCountryRestriction(request: NextRequest): Promise<{
  isBlocked: boolean
  response?: NextResponse
  country?: string | null
  countryName?: string
}> {
  try {
    console.log('🔍 Starting country restriction check...')
    const { isBlocked, country, countryName } = await isRequestFromBlockedCountry(request)
    
    console.log(`🌍 Country check result: ${country} -> ${isBlocked ? 'BLOCKED' : 'ALLOWED'}`)
    
    if (isBlocked) {
      console.log(`🚫 Task access blocked for country: ${countryName} (${country})`)
      
      const errorResponse = NextResponse.json({
        error: 'Task system is not available in your region',
        message: `Tasks are currently not available in ${countryName}. This restriction is in place due to regional compliance requirements.`,
        code: 'REGION_BLOCKED',
        country: country,
        countryName: countryName,
        details: {
          reason: 'Regional compliance restrictions',
          blockedCountries: ['India', 'Pakistan', 'Bangladesh'],
          alternativeMessage: 'You can still access other features of the platform including shopping, membership benefits, and referral programs.'
        }
      }, { 
        status: 403,
        headers: {
          'X-Country-Blocked': country || 'unknown',
          'X-Block-Reason': 'regional-compliance'
        }
      })
      
      return {
        isBlocked: true,
        response: errorResponse,
        country,
        countryName
      }
    }
    
    console.log(`✅ Country ${country} is allowed to access tasks`)
    return {
      isBlocked: false,
      country
    }
  } catch (error) {
    console.error('Error in task country restriction check:', error)
    
    // In case of error, allow access but log the issue
    return {
      isBlocked: false,
      country: null
    }
  }
}

/**
 * Check if task access should be blocked based on country
 * Returns null if allowed, error response if blocked
 */
export async function validateTaskAccess(request: NextRequest): Promise<NextResponse | null> {
  const { isBlocked, response } = await checkTaskCountryRestriction(request)
  return isBlocked ? response! : null
}

/**
 * Get user-friendly message for blocked countries
 */
export function getBlockedCountryMessage(countryName: string): {
  title: string
  message: string
  alternatives: string[]
} {
  return {
    title: `Tasks Not Available in ${countryName}`,
    message: `We're sorry, but our task system is currently not available in ${countryName} due to regional compliance requirements.`,
    alternatives: [
      '🛍️ Shop from our product catalog',
      '👥 Participate in our referral program', 
      '💎 Enjoy membership benefits and rewards',
      '📱 Access all other platform features',
      '🌐 Use VPN to access from a different region (at your own discretion)'
    ]
  }
}

/**
 * Development helper to test country blocking
 */
export async function testCountryBlocking(testCountry: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Country testing only available in development mode')
  }
  
  const blockedCountries = ['IN', 'PK', 'BD']
  return blockedCountries.includes(testCountry.toUpperCase())
}
